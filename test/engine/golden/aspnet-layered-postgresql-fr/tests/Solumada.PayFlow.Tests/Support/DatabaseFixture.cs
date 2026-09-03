using Testcontainers.PostgreSql;

namespace Solumada.PayFlow.Tests.Support;

// CORE-021 : le vrai moteur, dans un conteneur, démarré une fois pour toute la collection.
// L'image est épinglée : un test qui change de version de base sans le dire n'existe pas.
public sealed class DatabaseFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder(
        "postgres:17-alpine"
    ).Build();

    public string ConnectionString => _container.GetConnectionString();

    public Task InitializeAsync() => _container.StartAsync();

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();
}

// Une seule base pour tous les tests d'intégration : la démarrer par classe coûterait
// plusieurs dizaines de secondes.
[CollectionDefinition(DatabaseCollectionDefinition.Name)]
public sealed class DatabaseCollectionDefinition : ICollectionFixture<DatabaseFixture>
{
    public const string Name = "database";
}
