using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Services;
using System.Text;

using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddScoped<ISoapService, SoapService>();
// Configure GameServer Options
builder.Services.Configure<GameServerOptions>(options => 
{
    builder.Configuration.GetSection(GameServerOptions.SectionName).Bind(options);
    if (string.IsNullOrEmpty(options.CharactersDbConnectionString))
    {
        options.CharactersDbConnectionString = builder.Configuration.GetConnectionString("CharactersConnection") ?? "";
    }
});
builder.Services.AddScoped<IGameServerService, AzerothCoreGameServerService>();
builder.Services.AddHostedService<ServerMonitoringService>();

// Configure Request Size Limit (50MB)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800; // 50MB
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 52428800; // 50MB
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs",
        policy => policy.WithOrigins("http://localhost:3000")
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

// Configure DB Context (SQLite for Local Dev, MySQL for Prod)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString)); // TODO: Change to UseMySql for Prod

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_key_that_is_long_enough_12345";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "StoryOfTimeServer",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "StoryOfTimeClient",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();

app.UseCors("AllowNextJs");

// Enable serving static files from wwwroot
var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
provider.Mappings[".avif"] = "image/avif";
provider.Mappings[".webp"] = "image/webp";
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot")),
    ContentTypeProvider = provider
});

// app.UseStaticFiles(); // Replaced by above


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// TEMPORARY: Seed Admin User (Promote specific user 'm' or first user)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // Ensure DB is created
    // dbContext.Database.EnsureCreated(); 

    // Seed News if demo news are missing
    if (!dbContext.News.Any(n => n.Title == "补丁说明：更新 1.2 - 启程"))
    {
        Console.WriteLine("[SYSTEM] Seeding Initial News Data...");
        dbContext.News.AddRange(
            new StoryOfTime.Server.Models.News
            {
                Title = "补丁说明：更新 1.2 - 启程",
                Content = "<p>我们很高兴地宣布发布我们的第一次重大更新！这个补丁带来了一系列新功能、错误修复和游戏改进。</p>",
                Author = "DevTeam",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                Type = "更新",
                Thumbnail = "/demo-assets/news/24.jpeg"
            },
            new StoryOfTime.Server.Models.News
            {
                Title = "社区活动：大竞速",
                Content = "<p>本周末加入我们的大竞速活动！与其他玩家竞争，有机会赢得专属奖励和头衔。现在开始报名！</p>",
                Author = "CommunityManager",
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                Type = "活动",
                Thumbnail = "/demo-assets/news/28.jpeg"
            },
            new StoryOfTime.Server.Models.News
            {
                Title = "定期维护公告 - 10月30日",
                Content = "<p>服务器将于UTC时间10月30日凌晨2:00至6:00进行定期维护。给您带来的不便敬请谅解。</p>",
                Author = "ServerAdmin",
                CreatedAt = DateTime.UtcNow.AddDays(-8),
                Type = "维护",
                Thumbnail = "/demo-assets/news/5.jpeg"
            },
            new StoryOfTime.Server.Models.News
            {
                Title = "开发者日志：未来路线图",
                Content = "<p>抢先了解接下来的内容！在这篇开发者日志中，我们讨论了游戏的长期计划，包括新的扩展包和功能。</p>",
                Author = "LeadDesigner",
                CreatedAt = DateTime.UtcNow.AddDays(-12),
                Type = "综合",
                Thumbnail = "/demo-assets/news/7.jpg"
            },
            new StoryOfTime.Server.Models.News
            {
                Title = "新职业揭秘：奥术师",
                Content = "<p>使用全新的奥术师职业掌握奥术艺术！在我们最新的深度解析中了解他们的独特能力和游戏风格。</p>",
                Author = "DevTeam",
                CreatedAt = DateTime.UtcNow.AddDays(-17),
                Type = "更新",
                Thumbnail = "/demo-assets/news/6.avif"
            },
            new StoryOfTime.Server.Models.News
            {
                Title = "周末经验加成活动",
                Content = "<p>本周末所有玩家享受50%的经验值加成，助您快速升级！不要错过这个达到满级的机会。</p>",
                Author = "CommunityManager",
                CreatedAt = DateTime.UtcNow.AddDays(-22),
                Type = "活动",
                Thumbnail = "/demo-assets/news/8.webp"
            }
        );
        dbContext.SaveChanges();
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("[SYSTEM] Initial News Data Seeded Successfully.");
        Console.ResetColor();
    }

    // Try to find user 'm' first
    var targetUser = dbContext.Users.FirstOrDefault(u => u.Username == "m");
    
    // Fallback to first user if 'm' not found (just in case)
    if (targetUser == null)
    {
        targetUser = dbContext.Users.OrderBy(u => u.Id).FirstOrDefault();
    }

    if (targetUser != null && targetUser.AccessLevel < 10)
    {
        targetUser.AccessLevel = 10; // 10 = Admin
        dbContext.SaveChanges();
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"[SYSTEM] User '{targetUser.Username}' (ID: {targetUser.Id}) has been promoted to Admin (Level 10). Please Relogin!");
        Console.ResetColor();
    }
    else if (targetUser != null)
    {
         Console.WriteLine($"[SYSTEM] User '{targetUser.Username}' (ID: {targetUser.Id}) is already Admin (Level {targetUser.AccessLevel}).");
    }
}

app.Run();