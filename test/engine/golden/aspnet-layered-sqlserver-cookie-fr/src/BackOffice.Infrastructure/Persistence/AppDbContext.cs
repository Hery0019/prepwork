using Microsoft.EntityFrameworkCore;

namespace BackOffice.Infrastructure.Persistence;

// PERS-002 : aucun `DbSet`. Les entités entrent dans le modèle par leur configuration,
// donc ajouter une entité ne touche pas ce fichier.
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
