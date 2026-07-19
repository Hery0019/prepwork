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

# Les images Alpine n'embarquent pas ICU et forcent le mode invariant, que `Directory.Build.props` désactive. Sans ces paquets, l'application ne démarre pas. La variante `alpine-extra` n'existe que pour `runtime-deps`, donc pour un déploiement autonome : ici il faut les installer.
RUN apk add --no-cache icu-data-full icu-libs
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8

COPY --from=build /app .

# DOCK-002 : l'utilisateur `app` est fourni par l'image de base.
USER $APP_UID

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Solumada.PayFlow.Api.dll"]
