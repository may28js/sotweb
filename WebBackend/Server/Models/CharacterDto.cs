namespace StoryOfTime.Server.Models
{
    public class CharacterDto
    {
        public string Name { get; set; } = string.Empty;
        public int Level { get; set; }
        public int Race { get; set; }
        public int Class { get; set; }
        public int Gender { get; set; }
    }
}
