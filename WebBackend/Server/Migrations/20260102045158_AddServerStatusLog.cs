using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StoryOfTime.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddServerStatusLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServerStatusLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    OnlinePlayers = table.Column<int>(type: "INTEGER", nullable: false),
                    CpuUsage = table.Column<int>(type: "INTEGER", nullable: false),
                    MemoryUsage = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServerStatusLogs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServerStatusLogs");
        }
    }
}
