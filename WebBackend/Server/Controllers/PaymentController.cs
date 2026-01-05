using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;
using StoryOfTime.Server.Services;
using System.Security.Claims;

namespace StoryOfTime.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IOxapayService _oxapayService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(ApplicationDbContext context, IOxapayService oxapayService, ILogger<PaymentController> logger)
        {
            _context = context;
            _oxapayService = oxapayService;
            _logger = logger;
        }

        // POST: api/Payment/recharge
        [HttpPost("recharge")]
        [Authorize]
        public async Task<IActionResult> CreateRecharge([FromBody] RechargeRequest request)
        {
            if (request.Amount <= 0)
                return BadRequest("Amount must be greater than 0.");

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            // Create pending transaction
            var transaction = new PaymentTransaction
            {
                UserId = userId,
                Amount = request.Amount,
                Status = "Pending",
                OrderId = Guid.NewGuid().ToString("N")
            };

            _context.PaymentTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Call Oxapay
            OxapayInvoiceResponse? invoice = null;
            try 
            {
                invoice = await _oxapayService.CreateInvoiceAsync(request.Amount, transaction.OrderId, user.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception calling Oxapay service");
                transaction.Status = "Error";
                await _context.SaveChangesAsync();
                return StatusCode(500, new { message = "Payment service error." });
            }

            // Oxapay returns result=100 for success. 
            // The response structure might be flat (trackId, payLink at root) or nested in data.
            
            bool isSuccess = invoice != null && (invoice.result == 100 || invoice.message == "Successful operation");
            string? payLink = invoice?.data?.pay_link ?? invoice?.payLink;
            string? trackId = invoice?.data?.trackId.ToString() ?? invoice?.trackId;

            if (!isSuccess || string.IsNullOrEmpty(payLink))
            {
                _logger.LogError($"Oxapay failure. Result: {invoice?.result}, Message: {invoice?.message}");
                transaction.Status = "Failed";
                await _context.SaveChangesAsync();
                return StatusCode(500, new { message = "Failed to create payment invoice. " + (invoice?.message ?? "") });
            }

            transaction.ExternalId = trackId ?? "";
            await _context.SaveChangesAsync();

            return Ok(new { payLink = payLink });
        }

        // POST: api/Payment/webhook
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook([FromBody] OxapayWebhookRequest request)
        {
            _logger.LogInformation($"Webhook received: {request.trackId} - {request.status}");

            // Verify signature (Skipped for now, but essential for production)
            // if (!_oxapayService.ValidateSignature(...)) return BadRequest();

            if (request.status != "Paid" && request.status != "Completed") // Adjust based on actual Oxapay status
            {
                 // Handle other statuses if needed
                 return Ok();
            }

            var transaction = await _context.PaymentTransactions
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.OrderId == request.orderId);

            if (transaction == null)
            {
                _logger.LogWarning($"Transaction not found for OrderId: {request.orderId}");
                return NotFound();
            }

            if (transaction.Status == "Completed")
            {
                return Ok(); // Already processed
            }

            // Verify amount if needed
            // if (transaction.Amount != request.amount) ...

            transaction.Status = "Completed";
            transaction.CompletedAt = DateTime.UtcNow;
            
            // Apply Conversion Rate: 1 USD = 10 Points
            decimal conversionRate = 10.0m;
            decimal pointsToAdd = transaction.Amount * conversionRate;

            transaction.User.Points += pointsToAdd;

            // Log point change
            _context.UserPointLogs.Add(new UserPointLog
            {
                UserId = transaction.UserId,
                Amount = pointsToAdd,
                Source = $"Recharge {transaction.OrderId} (Rate: {conversionRate})",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class RechargeRequest
    {
        public decimal Amount { get; set; }
    }

    public class OxapayWebhookRequest
    {
        public long trackId { get; set; }
        public required string status { get; set; }
        public required string orderId { get; set; }
        public decimal amount { get; set; }
        public required string currency { get; set; }
        // Add other fields as per Oxapay docs
    }
}
