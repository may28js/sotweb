using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StoryOfTime.Server.Models
{
    public class ShopItem
    {
        public int Id { get; set; }

        [Required]
        public int GameItemId { get; set; } // 游戏物品ID (Entry ID)

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; } = 0; // 积分价格

        [MaxLength(255)]
        public string IconUrl { get; set; } = string.Empty; // 图标链接

        [MaxLength(255)]
        public string Category { get; set; } = "General"; // 分类 (Mounts, Bundles, etc.)

        public bool IsUnique { get; set; } = true; // 是否唯一 (唯一商品一次只能买一个)

        public bool IsActive { get; set; } = true; // 是否上架
    }
}
