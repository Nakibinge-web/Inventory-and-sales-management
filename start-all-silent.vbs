Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Start MySQL if XAMPP is present
If fso.FileExists("C:\xampp\mysql_start.bat") Then
    WshShell.Run "cmd /c C:\xampp\mysql_start.bat", 0, False
    WScript.Sleep 2000
End If

' 2. Start Laravel Backend (port 8000) completely hidden
WshShell.Run "cmd /c """ & strDir & "\backend\start-backend.bat""", 0, False
WScript.Sleep 1000

' 3. Start React Frontend (port 3000) completely hidden
WshShell.Run "cmd /c """ & strDir & "\frontend\start-frontend.bat""", 0, False

Set WshShell = Nothing
Set fso = Nothing
