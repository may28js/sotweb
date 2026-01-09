using System;
using System.IO;
using System.Security.Cryptography;
using System.Text.Json;
using System.Collections.Generic;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Host.Models;
using StoryOfTimeLauncher.Models;

namespace ManifestGenerator
{
    class Program
    {
        static async Task Main(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("Usage: ManifestGenerator <ClientDirectory> [OutputDirectory] [BaseDownloadUrl]");
                return;
            }

            string clientDir = args[0];
            string outputDir = args.Length > 1 ? args[1] : Directory.GetCurrentDirectory();
            string baseUrl = args.Length > 2 ? args[2] : "https://shiguanggushi.xyz/patch/";

            if (!Directory.Exists(clientDir))
            {
                Console.WriteLine($"Error: Directory {clientDir} not found.");
                return;
            }

            // 1. Generate Base Manifest (Core files)
            Console.WriteLine("Generating Base Manifest...");
            var baseManifest = new BaseClientManifest();
            var ignored = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Cache", "WTF", "Interface", "Screenshots", "Logs", "Errors", "Quarantine",
                "StoryOfTimeLauncher.exe", "ManifestGenerator.exe", "ManifestGenerator.pdb", "ManifestGenerator.runtimeconfig.json"
            };

            var patchFiles = new List<string>();

            foreach (var file in Directory.GetFiles(clientDir, "*", SearchOption.AllDirectories))
            {
                string relPath = Path.GetRelativePath(clientDir, file).Replace("\\", "/");
                string fileName = Path.GetFileName(file);
                
                // Ignore garbage
                if (ignored.Contains(relPath.Split('/')[0]) || ignored.Contains(fileName)) continue;

                // Separate Patch from Core
                if (IsPatchFile(fileName, relPath))
                {
                    patchFiles.Add(file);
                    // Patches are NOT in Base Manifest? 
                    // Wait, Base Manifest is for "Existence Check". 
                    // If we remove Patches from Base Manifest, then "QuickCheck" won't check if patches exist.
                    // But "PatchCheck" will handle them. So it is fine.
                    // Actually, let's keep everything in Base Manifest for "Size Check" (Lightest)
                    // But Patch Manifest will have "Fingerprint" for "Fast Hash".
                }
                
                // Add to Base Manifest (Everything gets a size check)
                baseManifest.Files.Add(new BaseFileEntry 
                { 
                    RelativePath = relPath, 
                    Size = new FileInfo(file).Length 
                });
            }

            string baseJson = JsonSerializer.Serialize(baseManifest, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(Path.Combine(outputDir, "base_manifest.json"), baseJson);


            // 2. Generate Patch Manifest (Only Patch files)
            Console.WriteLine("Generating Patch Manifest...");
            var patchManifest = new PatchManifest
            {
                Version = (int)(DateTime.UtcNow - new DateTime(2024, 1, 1)).TotalHours, // Simple versioning
                BaseUrl = baseUrl
            };

            foreach (var file in patchFiles)
            {
                string relPath = Path.GetRelativePath(clientDir, file).Replace("\\", "/");
                Console.Write($"Hashing Patch {relPath}... ");
                
                var info = new FileInfo(file);
                string md5 = await ComputeMD5(file);
                string fingerprint = await ComputeFingerprint(file); // Partial Hash

                patchManifest.Patches.Add(new PatchEntry
                {
                    RelativePath = relPath,
                    DownloadName = relPath, // Or flatten if needed
                    Size = info.Length,
                    MD5 = md5,
                    Fingerprint = fingerprint,
                    Action = "add"
                });
                Console.WriteLine("Done.");
            }

            string patchJson = JsonSerializer.Serialize(patchManifest, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(Path.Combine(outputDir, "patch_manifest.json"), patchJson);

            Console.WriteLine($"Generation Complete. Files saved to {outputDir}");
        }

        static bool IsPatchFile(string fileName, string relPath)
        {
            // Strict Scope: Data/zhCN/patch-zhCN-[A-Z].mpq
            // 1. Must be in Data/zhCN folder
            // 2. Must match pattern Patch-zhCN-[A-Z].MPQ (Case Insensitive)
            
            // Normalize separators
            string normalizedPath = relPath.Replace("\\", "/");
            
            // Check Directory
            if (!normalizedPath.StartsWith("Data/zhCN/", StringComparison.OrdinalIgnoreCase)) return false;

            // Check Filename Pattern
            // Pattern: Patch-zhCN-[A-Z].MPQ
            // Length check: "Patch-zhCN-X.MPQ" is 16 chars
            if (fileName.Length != 16) return false;
            
            if (!fileName.StartsWith("Patch-zhCN-", StringComparison.OrdinalIgnoreCase)) return false;
            if (!fileName.EndsWith(".MPQ", StringComparison.OrdinalIgnoreCase)) return false;

            // Check the letter (Index 11, if 0-based start from P)
            // "Patch-zhCN-X.MPQ"
            //  012345678901
            // char at 11 is the letter
            char letter = char.ToUpper(fileName[11]);
            return letter >= 'A' && letter <= 'Z';
        }

        static async Task<string> ComputeMD5(string path)
        {
            using var md5 = MD5.Create();
            using var stream = File.OpenRead(path);
            var hash = await md5.ComputeHashAsync(stream);
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }

        // Partial Hash: Start 64KB + Mid 64KB + End 64KB
        static async Task<string> ComputeFingerprint(string path)
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
            await fs.ReadAsync(buffer, 0, CHUNK_SIZE);
            
            // Read Mid
            fs.Position = (length / 2) - (CHUNK_SIZE / 2);
            await fs.ReadAsync(buffer, CHUNK_SIZE, CHUNK_SIZE);
            
            // Read End
            fs.Position = length - CHUNK_SIZE;
            await fs.ReadAsync(buffer, CHUNK_SIZE * 2, CHUNK_SIZE);

            var finalHash = sha.ComputeHash(buffer);
            return BitConverter.ToString(finalHash).Replace("-", "").ToLowerInvariant();
        }
    }
}
