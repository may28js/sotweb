using Microsoft.AspNetCore.Mvc.Filters;
using StoryOfTime.Server.Data;
using System.Security.Claims;

namespace StoryOfTime.Server.Filters
{
    public class UpdateLastActiveFilter : IAsyncActionFilter
    {
        private readonly ApplicationDbContext _context;

        public UpdateLastActiveFilter(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Execute the action first
            await next();

            // Then update last active time if authenticated
            if (context.HttpContext.User.Identity?.IsAuthenticated == true)
            {
                var userIdStr = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                             ?? context.HttpContext.User.FindFirst("id")?.Value;

                if (int.TryParse(userIdStr, out int userId))
                {
                    try 
                    {
                        var user = await _context.Users.FindAsync(userId);
                        if (user != null)
                        {
                            // Update only if more than 30 seconds have passed to reduce DB writes
                            if ((DateTime.UtcNow - user.LastActiveAt).TotalSeconds > 30)
                            {
                                user.LastActiveAt = DateTime.UtcNow;
                                await _context.SaveChangesAsync();
                            }
                        }
                    }
                    catch
                    {
                        // Ignore errors during activity update to not affect the response
                    }
                }
            }
        }
    }
}
