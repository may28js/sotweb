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

using StoryOfTime.Server.Services;
using Microsoft.Extensions.Caching.Memory;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _cache;

        // ACore SRP6 Constants
        private static readonly BigInteger N = BigInteger.Parse("0894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7", System.Globalization.NumberStyles.HexNumber);
        private static readonly BigInteger g = 7;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, ILogger<AuthController> logger, IEmailService emailService, IMemoryCache cache)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
            _cache = cache;
        }

        [HttpPost("send-verification-code")]
        [Authorize]
        public async Task<IActionResult> SendVerificationCode()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            // Generate 6-digit code
            var code = new Random().Next(100000, 999999).ToString();
            
            // Store in cache for 10 minutes
            _cache.Set($"VerifyCode_{userId}", code, TimeSpan.FromMinutes(10));

            // Send Email
            var subject = "【Story Of Time】您的验证码";
            var body = $@"
                <h3>您的验证码是：<span style='color:#FFD700; font-size: 24px;'>{code}</span></h3>
                <p>该验证码用于修改账户密码，请勿泄露给他人。</p>
                <p>验证码有效期为 10 分钟。</p>
            ";

            try 
            {
                await _emailService.SendEmailAsync(user.Email, subject, body);
                return Ok(new { message = "验证码已发送到您的注册邮箱，请查收。" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email.");
                return StatusCode(500, "发送验证码失败，请检查服务器邮件配置或联系管理员。");
            }
        }


        [HttpPost("register")]
        public async Task<ActionResult<User>> Register(UserDto request)
        {
            _logger.LogInformation("Received registration request for email: {Email}", request.Email);

            // 1. Check if user exists in Web DB
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest("用户名或邮箱已存在");
            }

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Email already registered.");
            }

            // 2. Check if user exists in Game DB (Pre-check)
            // If Game Settings are configured, we MUST ensure the username is available there too.
            // This prevents creating a Web User that cannot be synced to Game DB.
            var settings = await _context.GameServerSettings.FirstOrDefaultAsync();
            if (settings != null)
            {
                try 
                {
                    _logger.LogInformation("[Game Sync Pre-Check] Checking Game DB for existing user...");
                    var connectionString = $"Server={settings.Host};Port={settings.Port};Database={settings.AuthDatabase};User={settings.Username};Password={settings.Password};";
                    
                    using var connection = new MySqlConnector.MySqlConnection(connectionString);
                    await connection.OpenAsync();

                    using var checkCmd = connection.CreateCommand();
                    // Explicitly convert both DB column and input to UPPER case to be absolutely safe
                    checkCmd.CommandText = "SELECT COUNT(*) FROM account WHERE UPPER(username) = @username OR UPPER(email) = @email";
                    checkCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@username", request.Username.ToUpper()));
                    checkCmd.Parameters.Add(new MySqlConnector.MySqlParameter("@email", request.Email.ToUpper()));
                    
                    var countObj = await checkCmd.ExecuteScalarAsync();
                    var count = Convert.ToInt32(countObj);
                    
                    _logger.LogInformation($"[Game Sync Pre-Check] Query Result: {count} matches found for Username='{request.Username.ToUpper()}' OR Email='{request.Email.ToUpper()}'");

                    if (count > 0)
                    {
                        _logger.LogWarning("[Game Sync Pre-Check] Username '{Username}' or Email '{Email}' already exists in Game DB.", request.Username, request.Email);
                        return BadRequest("用户名或邮箱已存在");
                    }
                    _logger.LogInformation("[Game Sync Pre-Check] Username and Email are available in Game DB.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Game Sync Pre-Check] Failed to connect to Game DB. Aborting registration to ensure consistency.");
                    return StatusCode(500, $"注册失败: 无法连接到游戏数据库验证账号 - {ex.Message}");
                }
            }
            else
            {
                 _logger.LogWarning("[Game Sync Pre-Check] Game Settings not configured. Skipping Game DB check.");
            }

            // 3. Create Web User
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

            // 4. Sync to Game DB (Insert)
            // We already checked availability, but we wrap in try-catch for insertion errors
            if (settings != null)
            {
                try
                {
                    var connectionString = $"Server={settings.Host};Port={settings.Port};Database={settings.AuthDatabase};User={settings.Username};Password={settings.Password};";
                    using var connection = new MySqlConnector.MySqlConnection(connectionString);
                    await connection.OpenAsync();

                    // ... SRP6 Logic ...
                    // 1. Calculate SHA1 Hash: H1 = SHA1(UPPER(USERNAME + ":" + PASSWORD))
                    var rawString = $"{request.Username.ToUpper()}:{request.Password.ToUpper()}";
                    var sha1HashBytes = SHA1.HashData(Encoding.UTF8.GetBytes(rawString));

                    // 2. Generate Random Salt (32 bytes)
                    var saltBytes = new byte[32];
                    using (var rng = RandomNumberGenerator.Create())
                    {
                        rng.GetBytes(saltBytes);
                    }
                    saltBytes[0] |= 0x80; 

                    // 3. Calculate H2 = SHA1(Salt + H1)
                    var combined = new byte[saltBytes.Length + sha1HashBytes.Length];
                    Buffer.BlockCopy(saltBytes, 0, combined, 0, saltBytes.Length);
                    Buffer.BlockCopy(sha1HashBytes, 0, combined, saltBytes.Length, sha1HashBytes.Length);
                    
                    var h2Bytes = SHA1.HashData(combined);
                    
                    // 4. Calculate Verifier: v = g ^ x mod N
                    var x = new BigInteger(h2Bytes, isUnsigned: true, isBigEndian: false);
                    var v = BigInteger.ModPow(g, x, N);
                    var vBytes = v.ToByteArray(isUnsigned: true, isBigEndian: false);
                    
                    // Ensure vBytes is exactly 32 bytes
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

                    // Insert into account table
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
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Game Sync Error] Failed to sync account to game DB.");
                    
                    // Rollback Web User if Sync Fails
                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();
                    
                    return StatusCode(500, $"注册失败: 游戏数据库同步错误 - {ex.Message}");
                }
            }

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<ActionResult<string>> Login(UserLoginDto request)
        {
            _logger.LogInformation("Login request received for user: {Username}", request.Username);
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null)
            {
                _logger.LogWarning("Login failed: User {Username} not found.", request.Username);
                return BadRequest("User not found.");
            }

            bool isPasswordValid = false;
            bool needsRehash = false;

            try
            {
                // Try BCrypt verification
                if (BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    isPasswordValid = true;
                }
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Password hash is not in BCrypt format (Legacy support)
                // Fallback: Check if it matches plaintext (for development/migration)
                if (user.PasswordHash == request.Password)
                {
                    isPasswordValid = true;
                    needsRehash = true;
                }
            }
            catch (Exception ex)
            {
                 _logger.LogWarning(ex, "Password verification failed for user {Username}", request.Username);
                 // Treat as wrong password to avoid 500
                 return BadRequest("密码验证出错，请重置密码。");
            }

            if (!isPasswordValid)
            {
                _logger.LogWarning("Login failed: Wrong password for user {Username}.", request.Username);
                return BadRequest("Wrong password.");
            }

            // Auto-migrate legacy passwords to BCrypt
            if (needsRehash)
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Migrated password for user {Username} to BCrypt.", request.Username);
            }

            try 
            {
                string token = CreateToken(user);
                _logger.LogInformation("Login successful for user {Username}. Token generated.", request.Username);
                return Ok(new { 
                    token,
                    user = new {
                        user.Id,
                        user.Username,
                        user.Email,
                        user.Points,
                        user.AccessLevel
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create token for user {Username}", request.Username);
                return StatusCode(500, "Login failed: Token generation error.");
            }
        }

        [HttpGet("me")]
        [Authorize]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ActionResult<object>> GetMe()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.CommunityRoles)
                .ThenInclude(ur => ur.CommunityRole)
                .FirstOrDefaultAsync(u => u.Id == userId);
            
            if (user == null)
            {
                return NotFound("User not found.");
            }

            var allRoles = await _cache.GetOrCreateAsync("CommunityRoles", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                return await _context.CommunityRoles.OrderByDescending(r => r.SortOrder).ToListAsync();
            }) ?? new List<CommunityRole>();

            string roleColor = GetUserRoleColor(user, allRoles);

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.Points,
                user.AccessLevel,
                user.AvatarUrl,
                user.Nickname,
                user.AboutMe,
                user.PreferredStatus,
                RoleColor = roleColor
            });
        }

        private string GetUserRoleColor(User user, List<CommunityRole> allRoles)
        {
            if (user == null) return "#ffffff";
            
            var userRoleIds = user.CommunityRoles?.Select(ur => ur.CommunityRoleId).ToList() ?? new List<int>();
            
            // Combine Explicit Roles and Implicit System Roles (based on AccessLevel)
            var effectiveRoles = allRoles
                .Where(r => userRoleIds.Contains(r.Id) || (r.AccessLevel.HasValue && r.AccessLevel == user.AccessLevel))
                .OrderByDescending(r => r.SortOrder)
                .ToList();

            var topRole = effectiveRoles.FirstOrDefault();
            return topRole?.Color ?? "#ffffff";
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

            // Verify Code
            if (!_cache.TryGetValue($"VerifyCode_{userId}", out string? cachedCode) || cachedCode != request.VerificationCode)
            {
                return BadRequest("验证码无效或已过期。");
            }

            // Clean up code after use (prevent reuse)
            _cache.Remove($"VerifyCode_{userId}");

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
                4 => "Owner",
                3 => "Partner",
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
        public string VerificationCode { get; set; } = string.Empty;
    }
}
