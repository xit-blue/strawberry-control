FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/StrawberryControl.Web/StrawberryControl.Web.csproj src/StrawberryControl.Web/
RUN dotnet restore src/StrawberryControl.Web/StrawberryControl.Web.csproj
COPY . .
RUN dotnet publish src/StrawberryControl.Web/StrawberryControl.Web.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
RUN mkdir -p /app/App_Data/keys
ENTRYPOINT ["dotnet", "StrawberryControl.Web.dll"]
