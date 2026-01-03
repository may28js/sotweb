using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StoryOfTime.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddShopItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShopItems_ShopCategories_CategoryId",
                table: "ShopItems");

            migrationBuilder.DropIndex(
                name: "IX_ShopItems_CategoryId",
                table: "ShopItems");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "ShopItems");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ShopItems");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ShopItems");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "ShopItems");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "ShopItems",
                newName: "Name");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "ShopItems",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IconUrl",
                table: "ShopItems",
                type: "TEXT",
                maxLength: 255,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "ShopItems");

            migrationBuilder.DropColumn(
                name: "IconUrl",
                table: "ShopItems");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "ShopItems",
                newName: "Title");

            migrationBuilder.AddColumn<int>(
                name: "Amount",
                table: "ShopItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "ShopItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "ShopItems",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "ShopItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ShopItems_CategoryId",
                table: "ShopItems",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShopItems_ShopCategories_CategoryId",
                table: "ShopItems",
                column: "CategoryId",
                principalTable: "ShopCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
