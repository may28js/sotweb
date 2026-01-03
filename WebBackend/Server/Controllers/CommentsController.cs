using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.DTOs;
using StoryOfTime.Server.Models;
using System.Security.Claims;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Comments/News/5
        [HttpGet("News/{newsId}")]
        public async Task<ActionResult<IEnumerable<CommentDto>>> GetCommentsByNewsId(int newsId)
        {
            var comments = await _context.Comments
                .Where(c => c.NewsId == newsId)
                .Include(c => c.User)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    NewsId = c.NewsId,
                    UserId = c.UserId,
                    Username = c.User != null ? c.User.Username : "Unknown",
                    Avatar = null // Placeholder
                })
                .ToListAsync();

            return comments;
        }

        // POST: api/Comments
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<CommentDto>> PostComment(CreateCommentDto createCommentDto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            int userId = int.Parse(userIdClaim.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            // Check if News exists
            var news = await _context.News.FindAsync(createCommentDto.NewsId);
            if (news == null)
            {
                return NotFound("News article not found.");
            }

            var comment = new Comment
            {
                Content = createCommentDto.Content,
                NewsId = createCommentDto.NewsId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            var commentDto = new CommentDto
            {
                Id = comment.Id,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                NewsId = comment.NewsId,
                UserId = comment.UserId,
                Username = user.Username,
                Avatar = null
            };

            return CreatedAtAction(nameof(GetCommentsByNewsId), new { newsId = comment.NewsId }, commentDto);
        }

        // DELETE: api/Comments/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null)
            {
                return NotFound();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var accessLevelClaim = User.FindFirst("AccessLevel");

            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            int userId = int.Parse(userIdClaim.Value);
            int accessLevel = accessLevelClaim != null ? int.Parse(accessLevelClaim.Value) : 0;

            // Allow deletion if user is the owner OR if user is admin (AccessLevel >= 1)
            if (comment.UserId != userId && accessLevel < 1)
            {
                return Forbid();
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
