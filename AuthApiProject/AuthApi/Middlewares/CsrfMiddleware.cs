using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using static System.Net.WebRequestMethods;

namespace Auth.API.Middlewares
{
    public class CsrfMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<CsrfMiddleware> _logger;

        public CsrfMiddleware(RequestDelegate next, ILogger<CsrfMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();

            // Bỏ qua CSRF cho [AllowAnonymous]
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata?.GetMetadata<IAllowAnonymous>() != null)
            {
                _logger.LogDebug("Bỏ qua CSRF vì [AllowAnonymous]: {Path}", path);
                await _next(context);
                return;
            }

            // Bỏ qua CSRF cho các endpoint không yêu cầu xác thực
            var bypassPaths = new[]
            {
                "/auth/login",
                "/auth/logout",
                "/auth/verify-otp", // Thêm để bỏ qua CSRF cho verify-otp
                "/user/register",
                "/auth/generate-qr-code",
                "/user/otp-reset-password",
                "/user/reset-password",
            };

            if (bypassPaths.Contains(path))
            {
                _logger.LogDebug("Bỏ qua CSRF cho endpoint: {Path}", path);
                await _next(context);
                return;
            }

            // Chỉ kiểm tra CSRF cho POST/PUT/DELETE
            if (HttpMethods.IsPost(context.Request.Method) ||
                HttpMethods.IsPut(context.Request.Method) ||
                HttpMethods.IsDelete(context.Request.Method))
            {
                var csrfCookie = context.Request.Cookies["X-CSRF-TOKEN"];
                var csrfHeader = context.Request.Headers["X-CSRF-TOKEN"].ToString();

                if (string.IsNullOrEmpty(csrfCookie))
                {
                    _logger.LogWarning("CSRF cookie thiếu: {Path}", path);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsync("CSRF token is missing.");
                    return;
                }

                if (string.IsNullOrEmpty(csrfHeader) || csrfCookie != csrfHeader)
                {
                    _logger.LogWarning("CSRF token không khớp. Cookie: {Cookie}, Header: {Header}, Path: {Path}", csrfCookie, csrfHeader, path);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsync("CSRF token mismatch.");
                    return;
                }

                _logger.LogDebug("CSRF token hợp lệ: {Path}", path);
            }
            else if (HttpMethods.IsGet(context.Request.Method) && path == "/auth/me")
            {
                // Đặc biệt cho /auth/me, chỉ cần auth-token
                _logger.LogDebug("Bỏ qua CSRF check cho GET /auth/me");
            }

            await _next(context);
        }
    }
}