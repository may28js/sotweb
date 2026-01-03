using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StoryOfTime.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSshSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SshHost",
                table: "GameServerSettings",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SshPassword",
                table: "GameServerSettings",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SshPort",
                table: "GameServerSettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SshUsername",
                table: "GameServerSettings",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WorldServiceName",
                table: "GameServerSettings",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SshHost",
                table: "GameServerSettings");

            migrationBuilder.DropColumn(
                name: "SshPassword",
                table: "GameServerSettings");

            migrationBuilder.DropColumn(
                name: "SshPort",
                table: "GameServerSettings");

            migrationBuilder.DropColumn(
                name: "SshUsername",
                table: "GameServerSettings");

            migrationBuilder.DropColumn(
                name: "WorldServiceName",
                table: "GameServerSettings");
        }
    }
}
