# DOCK-001 : deux étapes. L'image finale ne porte ni SDK ni sources.
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# DOCK-AP-001 : les fichiers projet d'abord, pour que la restauration se mette en cache.
COPY global.json Directory.Build.props ./
COPY src/Solumada.PayFlow.Domain/Solumada.PayFlow.Domain.csproj src/Solumada.PayFlow.Domain/
COPY src/Solumada.PayFlow.Application/Solumada.PayFlow.Application.csproj src/Solumada.PayFlow.Application/
COPY src/Solumada.PayFlow.Infrastructure/Solumada.PayFlow.Infrastructure.csproj src/Solumada.PayFlow.Infrastructure/
COPY src/Solumada.PayFlow.Api/Solumada.PayFlow.Api.csproj src/Solumada.PayFlow.Api/
RUN dotnet restore src/Solumada.PayFlow.Api/Solumada.PayFlow.Api.csproj

COPY src/ src/
RUN dotnet publish src/Solumada.PayFlow.Api/Solumada.PayFlow.Api.csproj --configuration Release --no-restore --output /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
COPY --from=build /app .

# DOCK-002 : l'utilisateur `app` est fourni par l'image de base.
USER $APP_UID

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Solumada.PayFlow.Api.dll"]
