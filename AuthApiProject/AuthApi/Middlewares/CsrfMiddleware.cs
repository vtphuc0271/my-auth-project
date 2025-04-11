using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization; // Thêm để kiểm tra AllowAnonymous

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

            // Kiểm tra nếu endpoint có [AllowAnonymous], bỏ qua CSRF
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata?.GetMetadata<IAllowAnonymous>() != null)
            {
                await _next(context);
                return;
            }

            // Kiểm tra CSRF chỉ áp dụng cho các phương thức thay đổi dữ liệu (POST, PUT, DELETE)
            // Bỏ qua các endpoint không yêu cầu CSRF như login và logout
            if ((HttpMethods.IsPost(context.Request.Method) ||
                 HttpMethods.IsPut(context.Request.Method) ||
                 HttpMethods.IsDelete(context.Request.Method)) &&
                path != "/api/auth/login" &&
                path != "/api/auth/logout")
            {
                // Lấy CSRF token từ cookie
                var csrfCookie = context.Request.Cookies["X-CSRF-TOKEN"];

                // Lấy CSRF token từ header
                var csrfHeader = context.Request.Headers["X-CSRF-TOKEN"].ToString();

                // Kiểm tra sự tồn tại của CSRF token trong cookie
                if (string.IsNullOrEmpty(csrfCookie))
                {
                    _logger.LogWarning("CSRF cookie is missing.");
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsync("CSRF token is missing.");
                    return;
                }

                // Kiểm tra tính khớp nối giữa token trong cookie và header
                if (csrfCookie != csrfHeader)
                {
                    _logger.LogWarning("CSRF token mismatch. Cookie: {Cookie}, Header: {Header}", csrfCookie, csrfHeader);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsync("CSRF token mismatch.");
                    return;
                }
            }

            // Chuyển tiếp request nếu vượt qua kiểm tra CSRF hoặc không cần kiểm tra
            await _next(context);
        }
    }
}