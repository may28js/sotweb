using System.ComponentModel.DataAnnotations;

namespace StoryOfTime.Server.Models
{
    public class ShopCategory
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public int SortOrder { get; set; } = 0;
    }
}
