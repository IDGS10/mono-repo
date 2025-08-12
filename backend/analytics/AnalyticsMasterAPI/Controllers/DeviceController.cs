using AnalyticsPSQL_MasterApi.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsPSQL_MasterApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeviceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public DeviceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("registered_sensors")]
        public async Task<IActionResult> GetRegisteredSensors()
        {
            var sensors = await _context.SensorTypes.ToListAsync();
            return Ok(sensors);
        }
    }
}
