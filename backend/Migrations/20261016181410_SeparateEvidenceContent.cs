using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsuranceGroup.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeparateEvidenceContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Evidence_Size",
                table: "Evidence");

            migrationBuilder.AddColumn<int>(
                name: "Size",
                table: "Evidence",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "EvidenceContents",
                columns: table => new
                {
                    EvidenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Bytes = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvidenceContents", x => x.EvidenceId);
                    table.CheckConstraint("CK_EvidenceContents_Size", "octet_length(\"Bytes\") <= 10485760");
                    table.ForeignKey(
                        name: "FK_EvidenceContents_Evidence_EvidenceId",
                        column: x => x.EvidenceId,
                        principalTable: "Evidence",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                UPDATE "Evidence" SET "Size" = octet_length("Bytes");
                INSERT INTO "EvidenceContents" ("EvidenceId", "Bytes")
                SELECT "Id", "Bytes" FROM "Evidence" WHERE NOT "Abandoned";
                """);
            migrationBuilder.DropColumn(name: "Bytes", table: "Evidence");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Evidence_Size",
                table: "Evidence",
                sql: "\"Size\" >= 0 AND \"Size\" <= 10485760");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Evidence_Size",
                table: "Evidence");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "Evidence");

            migrationBuilder.AddColumn<byte[]>(
                name: "Bytes",
                table: "Evidence",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.Sql("""
                UPDATE "Evidence" e SET "Bytes" = c."Bytes"
                FROM "EvidenceContents" c WHERE c."EvidenceId" = e."Id";
                """);
            migrationBuilder.DropTable(name: "EvidenceContents");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Evidence_Size",
                table: "Evidence",
                sql: "octet_length(\"Bytes\") <= 10485760");
        }
    }
}
