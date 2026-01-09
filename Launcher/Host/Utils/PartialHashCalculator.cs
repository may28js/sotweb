using System;
using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace StoryOfTimeLauncher.Host.Utils
{
    public static class PartialHashCalculator
    {
        public static async Task<string> ComputeFingerprintAsync(string path)
        {
            const int CHUNK_SIZE = 64 * 1024; // 64KB
            using var fs = File.OpenRead(path);
            long length = fs.Length;
            
            using var sha = SHA256.Create();
            
            // If small file, just hash whole thing
            if (length <= CHUNK_SIZE * 3)
            {
                fs.Position = 0;
                var hash = await sha.ComputeHashAsync(fs);
                return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            }

            byte[] buffer = new byte[CHUNK_SIZE * 3];
            
            // Read Start
            fs.Position = 0;
            await fs.ReadExactlyAsync(buffer, 0, CHUNK_SIZE);
            
            // Read Mid
            fs.Position = (length / 2) - (CHUNK_SIZE / 2);
            await fs.ReadExactlyAsync(buffer, CHUNK_SIZE, CHUNK_SIZE);
            
            // Read End
            fs.Position = length - CHUNK_SIZE;
            await fs.ReadExactlyAsync(buffer, CHUNK_SIZE * 2, CHUNK_SIZE);

            var finalHash = sha.ComputeHash(buffer);
            return BitConverter.ToString(finalHash).Replace("-", "").ToLowerInvariant();
        }

        public static async Task<bool> VerifyFingerprintAsync(string path, string expectedFingerprint)
        {
            try
            {
                if (!File.Exists(path)) return false;
                string actual = await ComputeFingerprintAsync(path);
                return string.Equals(actual, expectedFingerprint, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }
    }
}
