#define MyAppName "SotLauncher"
#define MyAppVersion "1.0.5"
#define MyAppPublisher "StoryOfTime"
#define MyAppURL "https://shiguanggushi.xyz"
#define MyAppExeName "SotLauncher.exe"
#define SourcePath "BuildOutput"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{A8F9E872-3642-4D91-8769-9C5B2428E315}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
; Remove the following line to run in administrative install mode (install for all users.)
; PrivilegesRequired=lowest
OutputDir=Installer
OutputBaseFilename=SotLauncher_v{#MyAppVersion}
SetupIconFile=Host\sot.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
RestartApplications=yes
; 美化配置
; WizardImageFile=图片\phoenix-alar.jpg
; WizardSmallImageFile=Host\sot_small.bmp
WizardImageFile=Host\wizard_large.bmp
WizardSmallImageFile=Host\wizard_small.bmp

[Languages]
Name: "chinesesimplified"; MessagesFile: "Languages\ChineseSimplified.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#SourcePath}\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; 正常安装模式：在完成页显示“运行 SotLauncher”，默认勾选
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent

; 静默安装模式：安装结束后直接运行
Filename: "{app}\{#MyAppExeName}"; Flags: nowait skipifnotsilent
