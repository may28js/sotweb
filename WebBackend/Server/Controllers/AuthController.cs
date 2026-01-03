using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Numerics;
using System.Security.Cryptography;
using System.Text;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        // ACore SRP6 Constants
        private static readonly BigInteger N = BigInteger.Parse("0894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7", System.Globalization.NumberStyles.HexNumber);
        private static readonly BigInteger g = 7;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(UserDto request)
        {
            _logger.LogInformation("Received registration request for email: {Email}", request.Email);

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest("Username already exists.");
            }

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email already registered.");
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                AccessLevel = 0, // Default to User
                Points = 0 // Default Points
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Local user created with ID: {Id}. Starting Game Sync...", user.Id);

            // --- Game Database Sync (Start) ---
            try
            {
                var settings = await _context.GameServerSettings.FirstOrDefaultAsync();
                
                if (settings == null)
                {
                    _logger.LogWarning("[Game Sync Error] GameServerSettings is NULL! Skipping game account creation. Please configure Game Settings in Admin Panel.");
                }
                else
                {
                    _logger.LogInformation("[Game Sync] Settings found. Host: {Host}, AuthDB: {AuthDB}", settings.Host, settings.AuthDatabase);
                    
                    var connectionString = $"Server={settings.Host};Port={settings.Port};Database={settings.AuthDatabase};User={settings.Username};Password={settings.Password};";
                    
                    using var connection = new MySqlConnector.MySqlConnection(connectionString);
                    await connection.OpenAsync();
                    _logger.LogInformation("[Game Sync] Connected to Game Auth Database.");

                    // Check if account exists
                    using var checkCmd = connection.CreateCommand();
                    checkCmd.CommandText = "SELECT COUNT(*) FROM account WHERE username = @username OR email = @email";
                    checkCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@username", request.Username.ToUpper()));
                    checkCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@email", request.Email));
                    
                    var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());

                    if (count > 0)
                    {
                        _logger.LogWarning("[Game Sync] Account or Email already exists in Game DB. Skipping insertion.");
                    }
                    else
                    {
                        // 1. Calculate SHA1 Hash: H1 = SHA1(UPPER(USERNAME + ":" + PASSWORD))
                        var rawString = $"{request.Username.ToUpper()}:{request.Password.ToUpper()}";
                        var sha1HashBytes = SHA1.HashData(Encoding.UTF8.GetBytes(rawString));

                        // 2. Generate Random Salt (32 bytes)
                        var saltBytes = new byte[32];
                        using (var rng = RandomNumberGenerator.Create())
                        {
                            rng.GetBytes(saltBytes);
                        }
                        // FORCE Salt to be non-zero / large enough to avoid ACore trimming leading zeros
                        // This ensures consistent 32-byte length handling in ACore's BN_bin2bn/BN_bn2bin
                        saltBytes[0] |= 0x80; 

                        // 3. Calculate H2 = SHA1(Salt + H1)
                        var combined = new byte[saltBytes.Length + sha1HashBytes.Length];
                        Buffer.BlockCopy(saltBytes, 0, combined, 0, saltBytes.Length);
                        Buffer.BlockCopy(sha1HashBytes, 0, combined, saltBytes.Length, sha1HashBytes.Length);
                        
                        var h2Bytes = SHA1.HashData(combined);
                        
                        // 4. Calculate Verifier: v = g ^ x mod N
                        
                        // ACore Wiki: "Treat h2 as an integer in little-endian order"
                        // SHA1 output (h2Bytes) is a byte sequence. 
                        // C# BigInteger(byte[]) constructor interprets the byte array as Little-Endian.
                        // Therefore, we use h2Bytes directly without reversal.
                        
                        var x = new BigInteger(h2Bytes, isUnsigned: true, isBigEndian: false);

                        var v = BigInteger.ModPow(g, x, N);
                        
                        // ACore Wiki: "Convert the result back to a byte array in little-endian order"
                        var vBytes = v.ToByteArray(isUnsigned: true, isBigEndian: false);
                        
                        // Ensure vBytes is exactly 32 bytes (pad with zeros at the END for Little-Endian)
                        if (vBytes.Length < 32)
                        {
                            var temp = new byte[32];
                            Array.Copy(vBytes, 0, temp, 0, vBytes.Length);
                            vBytes = temp;
                        }
                        else if (vBytes.Length > 32)
                        {
                            var temp = new byte[32];
                            Array.Copy(vBytes, 0, temp, 0, 32);
                            vBytes = temp;
                        }

                        _logger.LogInformation($"[Game Sync Debug] Salt: {Convert.ToHexString(saltBytes)}");
                        _logger.LogInformation($"[Game Sync Debug] Verifier (Little-Endian): {Convert.ToHexString(vBytes)}");

                        // Insert into account table
                        // NOTE: Most SQL clients / ACore expect raw bytes.
                        // If ACore reads "verifier" column as BINARY(32) and casts to BigNumber assuming Little-Endian storage, this is correct.
                        using var insertCmd = connection.CreateCommand();
                        insertCmd.CommandText = @"
                            INSERT INTO account (username, salt, verifier, email, joindate, expansion) 
                            VALUES (@username, @salt, @verifier, @email, NOW(), 2)";
                        
                        insertCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@username", request.Username.ToUpper()));
                        insertCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@salt", saltBytes)); 
                        insertCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@verifier", vBytes));
                        insertCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@email", request.Email));

                        await insertCmd.ExecuteNonQueryAsync();
                        _logger.LogInformation("[Game Sync] Account created successfully in Game DB!");
                    }
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the web registration to avoid bad UX?
                // Or fail it? User previously experienced 500 error and reported it.
                // If we fail here, we should rollback the web user.
                _logger.LogError(ex, "[Game Sync Error] Failed to sync account to game DB.");
                
                // Rollback
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
                
                return StatusCode(500, $"注册失败: 游戏数据库同步错误 - {ex.Message}");
            }
            // --- Game Database Sync (End) ---

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<ActionResult<string>> Login(UserLoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest("Wrong password.");
            }

            string token = CreateToken(user);
            return Ok(new { token });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<object>> GetMe()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Points,
                user.AccessLevel
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("当前密码错误。");
            }

            if (request.NewPassword != request.ConfirmNewPassword)
            {
                return BadRequest("新密码与确认密码不匹配。");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "密码修改成功！" });
        }

        private string CreateToken(User user)
        {
            string role = user.AccessLevel switch
            {
                3 => "Owner",
                2 => "Admin",
                1 => "Moderator",
                _ => "User"
            };

            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, role), // Standard Role Claim
                new Claim("AccessLevel", user.AccessLevel.ToString()),
                new Claim("Points", user.Points.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration.GetSection("Jwt:Key").Value!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var token = new JwtSecurityToken(
                issuer: _configuration.GetSection("Jwt:Issuer").Value,
                audience: _configuration.GetSection("Jwt:Audience").Value,
                claims: claims,
                expires: DateTime.Now.AddDays(1),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt;
        }
    }

    public class UserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UserLoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}
