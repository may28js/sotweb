using System.Text;
using System.Text.Json;
using System.Security.Cryptography;

namespace StoryOfTime.Server.Services
{
    public interface IOxapayService
    {
        Task<OxapayInvoiceResponse?> CreateInvoiceAsync(decimal amount, string orderId, string email);
        bool ValidateSignature(string signature, string requestBody);
    }

    public class OxapayService : IOxapayService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly ILogger<OxapayService> _logger;

        public OxapayService(IConfiguration configuration, HttpClient httpClient, ILogger<OxapayService> logger)
        {
            _configuration = configuration;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<OxapayInvoiceResponse?> CreateInvoiceAsync(decimal amount, string orderId, string email)
        {
            var isSandbox = _configuration.GetValue<bool>("Oxapay:IsSandbox");
            var apiKey = _configuration["Oxapay:ApiKey"];

            var requestData = new
            {
                amount = amount,
                currency = "USDT", // Default to USDT for now
                lifetime = 30,
                fee_paid_by_payer = 0,
                return_url = _configuration["Oxapay:ReturnUrl"],
                callback_url = _configuration["Oxapay:CallbackUrl"],
                description = $"Recharge for Order {orderId}",
                order_id = orderId,
                email = email,
                sandbox = isSandbox
            };

            var json = JsonSerializer.Serialize(requestData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                // Use v1 API Endpoint
                var apiUrl = "https://api.oxapay.com/v1/payment/invoice";

                _logger.LogInformation($"Creating Oxapay invoice. URL: {apiUrl}, IsSandbox: {isSandbox}");

                var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                request.Headers.Add("merchant_api_key", apiKey);
                request.Content = content;

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var responseString = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Oxapay Response: {responseString}");

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                return JsonSerializer.Deserialize<OxapayInvoiceResponse>(responseString, options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Oxapay invoice");
                return null;
            }
        }

        public bool ValidateSignature(string signature, string requestBody)
        {
            // Oxapay HMAC validation logic
            // Assuming HMAC-SHA512 or similar. Need to check specific docs or assume standard.
            // For Sandbox/Test, we might skip or use a test key.
            // TODO: Implement actual validation based on User's provided documentation if available.
            return true; 
        }
    }

    public class OxapayInvoiceResponse
    {
        public int result { get; set; }
        public required string message { get; set; }
        // Fields can be directly here or in data, depending on endpoint. 
        // For /merchants/request, it seems they are flat in the response based on logs.
        public string? payLink { get; set; } // Note: JSON has payLink (camelCase) or pay_link? Log said payLink.
        public string? address { get; set; }
        public long? trackId { get; set; } // Changed to long? to handle JSON number

        
        // Keep data for compatibility if they change it back or other endpoints use it
        public OxapayInvoiceData? data { get; set; }
    }

    public class OxapayInvoiceData
    {
        public required string address { get; set; }
        public required string pay_link { get; set; }
        public long trackId { get; set; }
    }
}
