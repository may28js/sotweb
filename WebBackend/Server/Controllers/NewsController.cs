using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using System.Security.Claims;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/News
        [HttpGet]
        public async Task<ActionResult<IEnumerable<News>>> GetNews([FromQuery] string? type = null)
        {
            var query = _context.News.AsQueryable();

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(n => n.Type == type);
            }

            return await query.OrderByDescending(n => n.CreatedAt).ToListAsync();
        }

        // GET: api/News/5
        [HttpGet("{id}")]
        public async Task<ActionResult<News>> GetNews(int id)
        {
            var news = await _context.News.FindAsync(id);

            if (news == null)
            {
                return NotFound();
            }

            return news;
        }

        // POST: api/News
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<News>> PostNews(News news)
        {
            // Debug Logging
            Console.WriteLine($"[POST News] Received request. Title: {news.Title}, Author: {news.Author}, Type: {news.Type}");
            Console.WriteLine($"[POST News] Content Preview (first 100 chars): {(news.Content?.Length > 100 ? news.Content.Substring(0, 100) : news.Content)}");

            // Check Access Level
            var accessLevelClaim = User.FindFirst("AccessLevel");
            Console.WriteLine($"[POST News] User Claims: {string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"))}");

            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level) || level < StoryOfTime.Server.Models.User.Level_Moderator)
            {
                Console.WriteLine("[POST News] Access Denied: Insufficient AccessLevel.");
                return Forbid();
            }

            news.CreatedAt = DateTime.UtcNow;
            // Optionally set Author from token
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(username))
            {
                news.Author = username;
            }
            
            if (string.IsNullOrEmpty(news.Author))
            {
                 news.Author = "Admin"; // Fallback
            }

            try
            {
                _context.News.Add(news);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[POST News] Successfully created news ID: {news.Id}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[POST News] Database Error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[POST News] Inner Exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, "Internal Server Error during database save.");
            }

            return CreatedAtAction("GetNews", new { id = news.Id }, news);
        }

        // PUT: api/News/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutNews(int id, News news)
        {
            if (id != news.Id)
            {
                return BadRequest();
            }

            // Check Access Level
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level) || level < StoryOfTime.Server.Models.User.Level_Moderator)
            {
                return Forbid();
            }

            // Preserve original author and creation date if not provided (optional logic, 
            // but EF Core tracks entities, so we usually attach and modify)
            // Simpler approach: Set state to Modified
            
            // However, we want to ensure CreatedAt isn't lost if the client sends a default date.
            // Let's fetch the existing one first to be safe, or just trust the client sends everything.
            // Better: Fetch, Update, Save.
            
            var existingNews = await _context.News.FindAsync(id);
            if (existingNews == null)
            {
                return NotFound();
            }

            existingNews.Title = news.Title;
            existingNews.Content = news.Content;
            existingNews.Type = news.Type;
            existingNews.Thumbnail = news.Thumbnail;
            
            // Optionally update Author if you want to track who edited it, 
            // OR keep the original author. Let's keep the original author.

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NewsExists(id))
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

        private bool NewsExists(int id)
        {
            return _context.News.Any(e => e.Id == id);
        }

        // DELETE: api/News/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteNews(int id)
        {
            // Check Access Level
            var accessLevelClaim = User.FindFirst("AccessLevel");
            if (accessLevelClaim == null || !int.TryParse(accessLevelClaim.Value, out int level) || level < StoryOfTime.Server.Models.User.Level_Moderator)
            {
                return Forbid();
            }

            var news = await _context.News.FindAsync(id);
            if (news == null)
            {
                return NotFound();
            }

            _context.News.Remove(news);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}