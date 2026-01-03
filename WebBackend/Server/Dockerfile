# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["StoryOfTime.Server.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Run stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
# Ensure wwwroot/uploads exists
RUN mkdir -p wwwroot/uploads
EXPOSE 8080
ENTRYPOINT ["dotnet", "StoryOfTime.Server.dll"]
