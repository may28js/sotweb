using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        public UploadController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [HttpPost("image")]
        [Authorize] // Only logged-in users can upload
        public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string type = "news")
        {
            Console.WriteLine($"[Upload] Received upload request. Type: {type}");

            if (file == null || file.Length == 0)
            {
                Console.WriteLine("[Upload] File is null or empty.");
                return BadRequest("No file uploaded.");
            }
            
            Console.WriteLine($"[Upload] File Name: {file.FileName}, Size: {file.Length}");

            // 1. Validate file type (basic check)
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp", ".ico", ".svg" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                Console.WriteLine($"[Upload] Invalid extension: {extension}");
                return BadRequest("Invalid file type. Only images are allowed.");
            }

            try
            {
                // 2. Prepare storage path
                // Save to: wwwroot/uploads/{type}/yyyy/MM/
                var subFolder = type == "store" ? "store" : "news"; // Enforce folder names
                var webRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var uploadsFolder = Path.Combine(webRootPath, "uploads", subFolder, DateTime.Now.ToString("yyyy"), DateTime.Now.ToString("MM"));
                
                Console.WriteLine($"[Upload] Saving to: {uploadsFolder}");

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // 3. Generate unique filename
                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                // 4. Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // 5. Return URL
                // URL format: /uploads/{type}/2024/12/guid.png
                var url = $"/uploads/{subFolder}/{DateTime.Now:yyyy}/{DateTime.Now:MM}/{fileName}";
                Console.WriteLine($"[Upload] Success. URL: {url}");

                return Ok(new { url });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Upload] Error: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("images")]
        [Authorize]
        public IActionResult GetImages([FromQuery] string type = "store")
        {
            try
            {
                var subFolder = type == "store" ? "store" : "news";
                var webRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var targetFolder = Path.Combine(webRootPath, "uploads", subFolder);

                if (!Directory.Exists(targetFolder))
                {
                    return Ok(new List<object>());
                }

                var directoryInfo = new DirectoryInfo(targetFolder);
                
                // Get all files recursively
                var files = directoryInfo.GetFiles("*.*", SearchOption.AllDirectories)
                    .Where(f => new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp", ".ico", ".svg" }
                    .Contains(f.Extension.ToLowerInvariant()))
                    .OrderByDescending(f => f.CreationTime)
                    .Take(50); // Limit to last 50 images for now

                var imageFiles = files.Select(file => 
                {
                    // Construct relative URL
                    // We need to ensure the path starts with /uploads/...
                    // Path.GetRelativePath returns path relative to wwwroot, e.g., "uploads\store\2024\01\file.png"
                    var relativePath = Path.GetRelativePath(webRootPath, file.FullName).Replace("\\", "/");
                    if (!relativePath.StartsWith("/")) relativePath = "/" + relativePath;
                    
                    return new 
                    { 
                        url = relativePath, 
                        name = file.Name,
                        date = file.CreationTime 
                    };
                }).ToList();

                return Ok(imageFiles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("image")]
        [Authorize]
        public IActionResult DeleteImage([FromQuery] string url)
        {
            if (string.IsNullOrEmpty(url))
                return BadRequest("URL is required.");

            try
            {
                // URL example: /uploads/store/2024/01/guid.png
                // We need to validate that the path is within wwwroot/uploads
                var webRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                
                // Remove leading slash if present
                var relativePath = url.TrimStart('/');
                var fullPath = Path.Combine(webRootPath, relativePath);
                
                // Security check: Ensure the resolved path is indeed under wwwroot/uploads
                var uploadsPath = Path.Combine(webRootPath, "uploads");
                if (!Path.GetFullPath(fullPath).StartsWith(Path.GetFullPath(uploadsPath), StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest("Invalid file path.");
                }

                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    return Ok(new { message = "File deleted successfully" });
                }
                else
                {
                    return NotFound("File not found.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
