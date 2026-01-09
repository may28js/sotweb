using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace StoryOfTimeLauncher.Host.Utils
{
    public static class HashCalculator
    {
        /// <summary>
        /// 异步计算文件的 MD5 哈希值
        /// </summary>
        /// <param name="filePath">文件绝对路径</param>
        /// <returns>小写的 MD5 字符串</returns>
        public static async Task<string> ComputeMD5Async(string filePath)
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("File not found", filePath);
            }

            using (var md5 = MD5.Create())
            {
                using (var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, true))
                {
                    byte[] hashBytes = await md5.ComputeHashAsync(stream);
                    return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                }
            }
        }

        /// <summary>
        /// 验证文件 MD5 是否匹配
        /// </summary>
        /// <param name="filePath">文件路径</param>
        /// <param name="expectedHash">预期的 MD5</param>
        /// <returns>匹配返回 true</returns>
        public static async Task<bool> VerifyFileAsync(string filePath, string expectedHash)
        {
            if (!File.Exists(filePath)) return false;
            
            string actualHash = await ComputeMD5Async(filePath);
            return string.Equals(actualHash, expectedHash, StringComparison.OrdinalIgnoreCase);
        }
    }
}
