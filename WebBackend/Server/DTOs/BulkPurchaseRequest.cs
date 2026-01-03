namespace StoryOfTime.Server.DTOs
{
    public class BulkPurchaseRequest
    {
        public string CharacterName { get; set; } = string.Empty;
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    }

    public class CartItemDto
    {
        public int Id { get; set; }
        public int Quantity { get; set; }
    }
}
