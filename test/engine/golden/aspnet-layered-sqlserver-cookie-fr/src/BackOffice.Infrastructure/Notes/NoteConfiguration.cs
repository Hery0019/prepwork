using BackOffice.Domain.Notes;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BackOffice.Infrastructure.Notes;

// NET-006 : le mapping relationnel vit ici, un fichier par entité, et non dans le
// `DbContext`. Le `DbContext` les découvre tous à l'assemblage.
internal sealed class NoteConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("note");

        builder.HasKey(note => note.Id);
        builder
            .Property(note => note.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();
        builder
            .Property(note => note.Title)
            .HasColumnName("title")
            .HasColumnType("nvarchar(200)")
            .IsRequired();
        builder
            .Property(note => note.Body)
            .HasColumnName("body")
            .HasColumnType("nvarchar(max)")
            .IsRequired();
        builder
            .Property(note => note.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("datetimeoffset")
            .IsRequired();
    }
}
