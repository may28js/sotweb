using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StoryOfTime.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddGameServerSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GameServerSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Host = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Port = table.Column<int>(type: "INTEGER", nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Password = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    AuthDatabase = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CharactersDatabase = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    SoapHost = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    SoapPort = table.Column<int>(type: "INTEGER", nullable: false),
                    SoapUsername = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    SoapPassword = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameServerSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameServerSettings");
        }
    }
}
