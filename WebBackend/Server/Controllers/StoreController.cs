using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.Services;
using StoryOfTime.Server.DTOs;
using System.Security.Claims;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StoreController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ISoapService _soapService;
        private readonly ILogger<StoreController> _logger;

        public StoreController(ApplicationDbContext context, ISoapService soapService, ILogger<StoreController> logger)
        {
            _context = context;
            _soapService = soapService;
            _logger = logger;
        }

        // GET: api/Store/items
        [HttpGet("items")]
        public async Task<ActionResult<IEnumerable<ShopItem>>> GetShopItems()
        {
            return await _context.ShopItems
                .Where(s => s.IsActive)
                .ToListAsync();
        }

        // GET: api/Store/items/5
        [HttpGet("items/{id:int}")]
        public async Task<ActionResult<ShopItem>> GetShopItem(int id)
        {
            var item = await _context.ShopItems.FindAsync(id);

            if (item == null || !item.IsActive)
            {
                return NotFound();
            }

            return item;
        }

        // GET: api/Store/history
        [HttpGet("history")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PurchaseHistoryDto>>> GetHistory()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var orders = await _context.ShopOrders
                .Include(o => o.ShopItem)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Take(50) // Limit to last 50 orders
                .Select(o => new PurchaseHistoryDto
                {
                    Id = o.Id,
                    ItemName = o.ShopItem != null ? o.ShopItem.Name : "Unknown Item",
                    Cost = o.Cost,
                    CharacterName = o.CharacterName,
                    CreatedAt = o.CreatedAt,
                    Status = o.Status
                })
                .ToListAsync();

            return Ok(orders);
        }

        // POST: api/Store/purchase/5
        [HttpPost("purchase/{id:int}")]
        [Authorize]
        public async Task<IActionResult> Purchase(int id, [FromQuery] string characterName, [FromQuery] int quantity = 1)
        {
            if (string.IsNullOrWhiteSpace(characterName))
            {
                return BadRequest("角色名必填。");
            }

            if (quantity < 1)
            {
                return BadRequest("数量必须至少为 1。");
            }

            // 1. Get User
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("未找到用户。");

            // 2. Get ShopItem
            var shopItem = await _context.ShopItems.FindAsync(id);
            if (shopItem == null) return NotFound("未找到物品。");

            // Check Uniqueness
            if (shopItem.IsUnique && quantity > 1)
            {
                return BadRequest($"物品 '{shopItem.Name}' 是唯一物品，不能批量购买。");
            }

            var totalCost = shopItem.Price * quantity;

            // 3. Check Points
            if (user.Points < totalCost)
            {
                return BadRequest($"积分不足。您当前拥有 {user.Points}，但需要 {totalCost}。");
            }

            // 4. Process Transaction
            using var transaction = _context.Database.BeginTransaction();
            try
            {
                // Deduct points
                user.Points -= totalCost;

                // Create Order
                var order = new ShopOrder
                {
                    UserId = userId,
                    ShopItemId = id,
                    Cost = totalCost,
                    Status = "Pending", 
                    CreatedAt = DateTime.UtcNow,
                    CharacterName = characterName, // Use CharacterName instead of CharacterId
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown"
                };
                _context.ShopOrders.Add(order);

                // Log Point Usage
                var log = new UserPointLog
                {
                    UserId = userId,
                    Amount = -totalCost,
                    Source = $"Purchase: {quantity}x {shopItem.Name}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserPointLogs.Add(log);

                // Save changes locally first to ensure DB integrity before external call
                await _context.SaveChangesAsync();

                // 5. Send Item via SOAP
                // Command format: send items <playername> "Subject" "Text" <itemid>[:count]
                var command = $"send items {characterName} \"Store Purchase\" \"Thank you for purchasing {shopItem.Name}!\" {shopItem.GameItemId}:{quantity}";
                
                var soapResult = await _soapService.SendCommandAsync(command);

                if (soapResult)
                {
                    order.Status = "Delivered";
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    
                    return Ok(new { message = $"成功购买 {quantity}x {shopItem.Name} 并已发送给 {characterName}", newBalance = user.Points });
                }
                else
                {
                    // SOAP failed, rollback transaction
                    // Note: Since we called SaveChangesAsync, the changes are in the transaction but not committed.
                    // Rolling back will undo them.
                    throw new Exception("发送物品到游戏服务器失败。请检查角色名或稍后再试。");
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "交易失败: " + ex.Message);
            }
        }

        // POST: api/Store/purchase/bulk
        [HttpPost("purchase/bulk")]
        [Authorize]
        public async Task<IActionResult> PurchaseBulk([FromBody] BulkPurchaseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CharacterName))
            {
                // Return ProblemDetails-like object to be consistent with client error handling expectations if needed,
                // or just simple BadRequest. Since client now handles objects, we can return consistent object.
                return BadRequest(new { message = "角色名必填。" });
            }

            if (request.Items == null || !request.Items.Any())
            {
                return BadRequest(new { message = "没有要购买的物品。" });
            }

            // 1. Get User
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("未找到用户。");

            // 2. Validate Items and Calculate Total
            decimal totalCost = 0;
            var purchaseItems = new List<(ShopItem Item, int Quantity)>();

            foreach (var itemDto in request.Items)
            {
                if (itemDto.Quantity < 1) return BadRequest(new { message = $"物品 ID {itemDto.Id} 的数量无效" });

                var shopItem = await _context.ShopItems.FindAsync(itemDto.Id);
                if (shopItem == null) return NotFound(new { message = $"未找到 ID 为 {itemDto.Id} 的物品。" });
                
                if (shopItem.IsUnique && itemDto.Quantity > 1)
                {
                    return BadRequest(new { message = $"物品 '{shopItem.Name}' 是唯一物品，不能批量购买。" });
                }

                purchaseItems.Add((shopItem, itemDto.Quantity));
                totalCost += shopItem.Price * itemDto.Quantity;
            }

            // 3. Check Points
            if (user.Points < totalCost)
            {
                return BadRequest(new { message = $"积分不足。您当前拥有 {user.Points}，但需要 {totalCost}。" });
            }

            // 4. Process Transaction
            using var transaction = _context.Database.BeginTransaction();
            try
            {
                // Deduct points
                user.Points -= totalCost;

                var successCount = 0;

                foreach (var (shopItem, quantity) in purchaseItems)
                {
                    // Create Order
                    var order = new ShopOrder
                    {
                        UserId = userId,
                        ShopItemId = shopItem.Id,
                        Cost = shopItem.Price * quantity,
                        Status = "Pending", 
                        CreatedAt = DateTime.UtcNow,
                        CharacterName = request.CharacterName,
                        IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown"
                    };
                    _context.ShopOrders.Add(order);

                    // Log Point Usage
                    var log = new UserPointLog
                    {
                        UserId = userId,
                        Amount = -(shopItem.Price * quantity),
                        Source = $"Bulk Purchase: {quantity}x {shopItem.Name}",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.UserPointLogs.Add(log);

                    // Send Item via SOAP
                    var command = $"send items {request.CharacterName} \"Store Purchase\" \"Thank you for purchasing {shopItem.Name}!\" {shopItem.GameItemId}:{quantity}";
                    var soapResult = await _soapService.SendCommandAsync(command);

                    if (soapResult)
                    {
                        order.Status = "Delivered";
                        successCount++;
                    }
                    else
                    {
                        // If one fails, we should probably fail the whole batch or handle partials?
                        // For simplicity/safety, let's fail the whole batch if one fails to ensure consistency.
                        throw new Exception($"发送物品 {shopItem.Name} 到游戏服务器失败。");
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return Ok(new { message = $"成功为 {request.CharacterName} 购买了 {successCount} 件物品", newBalance = user.Points });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "交易失败: " + ex.Message });
            }
        }

        // POST: api/Store/donate
        [HttpPost("donate")]
        [Authorize]
        public async Task<IActionResult> Donate([FromBody] DonateRequest request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            // Simulation: Add points immediately (Skip Payment Gateway)
            var totalPoints = request.Amount + request.Bonus;
            user.Points += totalPoints;

            var log = new UserPointLog
            {
                UserId = userId,
                Amount = totalPoints,
                Source = $"Donation: {request.Amount} (+{request.Bonus}) Crystals - {request.Price} EUR",
                CreatedAt = DateTime.UtcNow
            };
            _context.UserPointLogs.Add(log);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Donation successful", newBalance = user.Points });
        }

        public class DonateRequest
        {
            public int Amount { get; set; }
            public int Bonus { get; set; }
            public decimal Price { get; set; }
        }

        // ==========================================
        // Admin Management Endpoints
        // ==========================================

        [HttpPost("items")]
        [Authorize]
        public async Task<ActionResult<ShopItem>> CreateShopItem(ShopItem item)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 1)
            {
                return Forbid();
            }

            // Validation
            if (string.IsNullOrWhiteSpace(item.Name))
                return BadRequest("Item name is required.");
            if (item.Price <= 0)
                return BadRequest("Price must be greater than 0.");
            if (item.GameItemId <= 0)
                return BadRequest("Invalid Game Item ID.");

            _context.ShopItems.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetShopItems), new { id = item.Id }, item);
        }

        [HttpPut("items/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateShopItem(int id, ShopItem item)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 1)
            {
                return Forbid();
            }

            if (id != item.Id)
            {
                return BadRequest();
            }

            // Validation
            if (string.IsNullOrWhiteSpace(item.Name))
                return BadRequest("Item name is required.");
            if (item.Price <= 0)
                return BadRequest("Price must be greater than 0.");
            if (item.GameItemId <= 0)
                return BadRequest("Invalid Game Item ID.");

            _context.Entry(item).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.ShopItems.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("items/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteShopItem(int id)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 1)
            {
                return Forbid();
            }

            var item = await _context.ShopItems.FindAsync(id);
            if (item == null) return NotFound();

            _context.ShopItems.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<ShopCategory>>> GetCategories()
        {
            return await _context.ShopCategories.ToListAsync();
        }

        [HttpGet("my-characters")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<CharacterDto>>> GetMyCharacters()
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username)) return Unauthorized();

            var settings = await _context.GameServerSettings.FirstOrDefaultAsync();
            if (settings == null) return StatusCode(500, "Game server settings not found.");

            // 1. Get Account ID from Auth DB
            int accountId = 0;
            var authConnStr = $"Server={settings.Host};Port={settings.Port};Database={settings.AuthDatabase};User={settings.Username};Password={settings.Password};";

            try
            {
                using var authConn = new MySqlConnector.MySqlConnection(authConnStr);
                await authConn.OpenAsync();
                
                using var cmd = authConn.CreateCommand();
                cmd.CommandText = "SELECT id FROM account WHERE username = @username";
                cmd.Parameters.Add(new MySqlConnector.MySqlParameter("@username", username.ToUpper())); // ACore usernames are usually uppercase in DB

                var result = await cmd.ExecuteScalarAsync();
                if (result == null) return NotFound("Game account not found.");
                
                accountId = Convert.ToInt32(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error connecting to Auth Database");
                return StatusCode(500, "Failed to connect to game authentication server.");
            }

            // 2. Get Characters from Characters DB
            var characters = new List<CharacterDto>();
            // Assuming default characters DB name based on auth DB name or settings
            // If settings doesn't have CharactersDatabase, we might need to add it or assume "acore_characters"
            // For now, let's assume 'characters' or use a property if added to settings.
            // Looking at AuthController, only AuthDatabase is used. Let's assume standard "acore_characters" or derive from settings if possible.
            // Let's check settings again.
            // Settings has: AuthDatabase. Let's assume CharactersDatabase is "acore_characters" for now or check if Settings model has it.
            // Wait, previous context showed GameServerSettings has "CharactersDatabase" property!
            
            var charsConnStr = $"Server={settings.Host};Port={settings.Port};Database={settings.CharactersDatabase};User={settings.Username};Password={settings.Password};";

            try
            {
                using var charConn = new MySqlConnector.MySqlConnection(charsConnStr);
                await charConn.OpenAsync();

                using var cmd = charConn.CreateCommand();
                cmd.CommandText = "SELECT name, race, class, level, gender FROM characters WHERE account = @accountId";
                cmd.Parameters.Add(new MySqlConnector.MySqlParameter("@accountId", accountId));

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    characters.Add(new CharacterDto
                    {
                        Name = reader.GetString(0),
                        Race = reader.GetInt32(1),
                        Class = reader.GetInt32(2),
                        Level = reader.GetInt32(3),
                        Gender = reader.GetInt32(4)
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error connecting to Characters Database");
                return StatusCode(500, "Failed to connect to game characters server.");
            }

            return Ok(characters);
        }
        
        [HttpPost("categories")]
        [Authorize]
        public async Task<ActionResult<ShopCategory>> CreateCategory(ShopCategory category)
        {
             var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 1)
            {
                return Forbid();
            }
            
            _context.ShopCategories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpPut("categories/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateCategory(int id, ShopCategory category)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 1)
            {
                return Forbid();
            }

            if (id != category.Id) return BadRequest();

            _context.Entry(category).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("categories/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || int.Parse(accessLevelClaim.Value) < 1)
            {
                return Forbid();
            }

            var category = await _context.ShopCategories.FindAsync(id);
            if (category == null) return NotFound();

            _context.ShopCategories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
