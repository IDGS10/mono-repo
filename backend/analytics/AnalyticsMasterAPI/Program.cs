using AnalyticsPSQL_MasterApi.Data;
using AnalyticsPSQL_MasterApi.Infrastructure;
using AnalyticsPSQL_MasterApi.Services;
using InfluxDB.Client;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework for PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(300); // 5 minutos para queries complejas
        npgsqlOptions.EnableRetryOnFailure(3); // Reintentos automáticos
    });
});


// Configure InfluxDB
builder.Services.Configure<InfluxDbOptions>(
    builder.Configuration.GetSection("InfluxDb"));

builder.Services.AddSingleton<IInfluxDBClient>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var url = config["InfluxDb:Url"];
    var token = config["InfluxDb:Token"];

    if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(token))
    {
        throw new InvalidOperationException("InfluxDB URL and Token are required");
    }

    return new InfluxDBClient(url, token);
});

// Register simulation services
builder.Services.AddScoped<IInfluxSimulationService,InfluxSimulationService>();

// Register the background service
builder.Services.AddHostedService<InfluxSimulationBackgroundService>();

// Configure logging
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.AddDebug();
    logging.SetMinimumLevel(LogLevel.Information);
});

// CORS development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});





var app = builder.Build();

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

// Configure Swagger for all environments
//app.UseSwagger();
app.UseSwagger( c =>
{
    // Modificar el path base del documento swagger
    c.RouteTemplate = "swagger/{documentName}/swagger.json";
    c.PreSerializeFilters.Add((swaggerDoc, httpReq) =>
    {
        // Forzar el servidor base URL a incluir /analytics
        var scheme = httpReq.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? httpReq.Scheme;
        var host = httpReq.Headers["X-Forwarded-Host"].FirstOrDefault() ?? httpReq.Host.Value;

        var serverUrl = $"{scheme}://{host}/analytics";
        swaggerDoc.Servers = new List<OpenApiServer>
        {
            new OpenApiServer { Url = serverUrl }
        };
    });
});
app.UseSwaggerUI();

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("https://server-uteq.nrsoftware.online/analytics/swagger/v1/swagger.json", "ESP32 Analytics API v1");
    c.RoutePrefix = "swagger"; // Root swagger
});

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
