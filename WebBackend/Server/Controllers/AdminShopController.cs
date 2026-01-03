using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/admin/shop")]
    [ApiController]
    // [Authorize(Roles = "Admin,Owner")] // Temporarily disable role check to debug 403
    [Authorize] // Only require authentication, custom check inside
    public class AdminShopController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminShopController(ApplicationDbContext context)
        {
            _context = context;
        }

        private bool IsAdmin()
        {
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null) return false;
            return int.TryParse(accessLevelClaim.Value, out int level) && level >= 2;
        }

        // GET: api/admin/shop
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ShopItem>>> GetItems()
        {
            if (!IsAdmin()) return Forbid();
            return await _context.ShopItems.ToListAsync();
        }

        // GET: api/admin/shop/orders
        [HttpGet("orders")]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders()
        {
            if (!IsAdmin()) return Forbid();
            
            var orders = await _context.ShopOrders
                .Include(o => o.User)
                .Include(o => o.ShopItem)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    ItemName = o.ShopItem != null ? o.ShopItem.Name : "Unknown Item",
                    Price = o.Cost,
                    Buyer = o.User != null ? o.User.Username : "Unknown User",
                    Character = o.CharacterName,
                    Date = o.CreatedAt
                })
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/admin/shop/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ShopItem>> GetItem(int id)
        {
            if (!IsAdmin()) return Forbid();
            var item = await _context.ShopItems.FindAsync(id);

            if (item == null)
            {
                return NotFound();
            }

            return item;
        }

        // POST: api/admin/shop
        [HttpPost]
        public async Task<ActionResult<ShopItem>> CreateItem(ShopItem item)
        {
            if (!IsAdmin()) return Forbid();
            _context.ShopItems.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
        }

        // PUT: api/admin/shop/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateItem(int id, ShopItem item)
        {
            if (!IsAdmin()) return Forbid();
            if (id != item.Id)
            {
                return BadRequest();
            }

            _context.Entry(item).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ItemExists(id))
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

        // DELETE: api/admin/shop/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            if (!IsAdmin()) return Forbid();
            var item = await _context.ShopItems.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            _context.ShopItems.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ItemExists(int id)
        {
            return _context.ShopItems.Any(e => e.Id == id);
        }
    }
}
