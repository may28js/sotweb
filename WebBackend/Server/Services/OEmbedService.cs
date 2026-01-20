using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace StoryOfTime.Server.Services
{
    public class EmbedData 
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "video";
        
        [JsonPropertyName("provider_name")]
        public string ProviderName { get; set; } = "";
        
        [JsonPropertyName("title")]
        public string Title { get; set; } = "";
        
        [JsonPropertyName("author_name")]
        public string AuthorName { get; set; } = "";
        
        [JsonPropertyName("thumbnail_url")]
        public string ThumbnailUrl { get; set; } = "";
        
        [JsonPropertyName("url")]
        public string Url { get; set; } = "";
    }

    public interface IOEmbedService
    {
        Task<List<EmbedData>> ProcessContentAsync(string content);
    }

    public class OEmbedService : IOEmbedService
    {
        private readonly HttpClient _httpClient;
        // YouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
        private static readonly Regex YouTubeRegex = new Regex(@"(?:https?://)?(?:www\.|m\.)?youtube\.com/watch\?v=[\w-]+|(?:https?://)?youtu\.be/[\w-]+", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        // Bilibili: https://www.bilibili.com/video/BV...
        private static readonly Regex BilibiliRegex = new Regex(@"(?:https?://)?(?:www\.|m\.)?bilibili\.com/video/BV[\w]+", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public OEmbedService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            // Add User-Agent to avoid 403 Forbidden from some APIs
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        }

        public async Task<List<EmbedData>> ProcessContentAsync(string content)
        {
            var embeds = new List<EmbedData>();
            if (string.IsNullOrWhiteSpace(content)) return embeds;

            var urls = ExtractUrls(content);
            Console.WriteLine($"[OEmbedService] Extracted {urls.Count} URLs from content.");
            
            foreach (var rawUrl in urls)
            {
                var url = rawUrl;
                if (!url.StartsWith("http://") && !url.StartsWith("https://"))
                {
                    url = "https://" + url;
                }

                EmbedData? embed = null;
                if (YouTubeRegex.IsMatch(url))
                {
                    embed = await GetYouTubeEmbedAsync(url);
                }
                else if (BilibiliRegex.IsMatch(url))
                {
                    embed = await GetBilibiliEmbedAsync(url);
                }

                if (embed != null)
                {
                    embeds.Add(embed);
                }
            }

            return embeds;
        }

        private List<string> ExtractUrls(string content)
        {
            var urls = new List<string>();
            
            var ytMatches = YouTubeRegex.Matches(content);
            foreach (Match match in ytMatches)
            {
                urls.Add(match.Value);
            }

            var biliMatches = BilibiliRegex.Matches(content);
            foreach (Match match in biliMatches)
            {
                urls.Add(match.Value);
            }

            return urls.Distinct().ToList();
        }

        private async Task<EmbedData?> GetYouTubeEmbedAsync(string url)
        {
            try 
            {
                var oembedUrl = $"https://www.youtube.com/oembed?url={Uri.EscapeDataString(url)}&format=json";
                Console.WriteLine($"[OEmbedService] Fetching YouTube: {oembedUrl}");
                var response = await _httpClient.GetStringAsync(oembedUrl);
                
                using var json = JsonDocument.Parse(response);
                var root = json.RootElement;
                
                return new EmbedData
                {
                    Type = "video",
                    ProviderName = "YouTube",
                    Title = root.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                    AuthorName = root.TryGetProperty("author_name", out var a) ? a.GetString() ?? "" : "",
                    ThumbnailUrl = root.TryGetProperty("thumbnail_url", out var th) ? th.GetString() ?? "" : "",
                    Url = url
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OEmbedService] YouTube Error: {ex.Message}");
                return null;
            }
        }

        private async Task<EmbedData?> GetBilibiliEmbedAsync(string url)
        {
            try
            {
                // Bilibili API: https://api.bilibili.com/x/web-interface/view?bvid=...
                var match = Regex.Match(url, @"BV[\w]+");
                if (!match.Success) 
                {
                    Console.WriteLine($"[OEmbedService] Bilibili BV not found in: {url}");
                    return null;
                }
                
                var bvid = match.Value;
                var apiUrl = $"https://api.bilibili.com/x/web-interface/view?bvid={bvid}";
                Console.WriteLine($"[OEmbedService] Fetching Bilibili: {apiUrl}");
                var response = await _httpClient.GetStringAsync(apiUrl);
                
                using var json = JsonDocument.Parse(response);
                var root = json.RootElement;
                if (root.GetProperty("code").GetInt32() != 0) 
                {
                    Console.WriteLine($"[OEmbedService] Bilibili API Error Code: {root.GetProperty("code").GetInt32()} - {root.GetProperty("message").GetString()}");
                    return null;
                }

                var data = root.GetProperty("data");
                var title = data.GetProperty("title").GetString() ?? "";
                var pic = data.GetProperty("pic").GetString() ?? ""; 
                var owner = data.GetProperty("owner").GetProperty("name").GetString() ?? "";
                
                Console.WriteLine($"[OEmbedService] Bilibili Success: {title}");

                return new EmbedData
                {
                    Type = "video",
                    ProviderName = "Bilibili",
                    Title = title,
                    AuthorName = owner,
                    ThumbnailUrl = pic,
                    Url = url
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[OEmbedService] Bilibili Error: {ex.Message}");
                return null;
            }
        }
    }
}
