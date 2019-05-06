:: ------------------------------------------------------------------
:: Simple script to build a proper PKG using Python (by CaptainCPS-X)
:: Adapted to PS3xploit-ReSigner (by Caio99BR)
:: ------------------------------------------------------------------
:: Disable Debug output
@echo off

:: Save Current Working Dir
set CURRENT_DIR=%1
set RAP_SIGNED_FILE_NAME=%2
set PKG_FOLDER=%3

:: Go to current dir
cd "%CURRENT_DIR%"

:: Main Tools
set TOOLS_PKG_EXDATA=server\resigner\bin\win32\pkg_exdata.exe
set TOOLS_RESIGNER=server\resigner\bin\win32\ps3xploit_rifgen_edatresign.exe

:: Output Dirs
set OUTPUT_PKGS_DIR=resigner\output\pkgs
set OUTPUT_TEMP_DIR=resigner\output\temp

:: Input Dirs
set INPUT_PKGS_DIR=resigner\input\pkgs
set INPUT_RAPS_DIR=resigner\input\raps

:: Input Files
set INPUT_ACT_DAT=resigner\consoles\default\act.dat
set INPUT_IDPS_HEX=resigner\consoles\default\idps.hex

:: RIF Package ContentID and Name
set RIF_PKG_CONTENTID=RIF000-INSTALLER_00-0000000000000000
set RIF_PKG_NAME=%RAP_SIGNED_FILE_NAME%.rif.pkg

:: Prevent missing dirs
if not exist "%PKG_FOLDER%\%INPUT_PKGS_DIR%\" mkdir "%PKG_FOLDER%\%INPUT_PKGS_DIR%\"
if not exist "%PKG_FOLDER%\%INPUT_RAPS_DIR%\" mkdir "%PKG_FOLDER%\%INPUT_RAPS_DIR%\"
if not exist "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\" mkdir "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\"
if not exist "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\" mkdir "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\"

:: Check for RAP or PKG files
if not exist "%PKG_FOLDER%\%INPUT_RAPS_DIR%\*.rap" (
	echo. 
	echo ps3xploit_resign: No '.rap' files found on '.\%INPUT_RAPS_DIR%\'
	echo. 
	if exist "%PKG_FOLDER%\%INPUT_PKGS_DIR%\*.pkg" (
		GOTO RESIGN_PKG_ONLY
	) else (
		echo. 
		echo ps3xploit_resign: No '.pkg' files found on '.\%INPUT_PKGS_DIR%\'
		echo. 
		pause
		exit /b
	)
)

:: Copy act.dat files
if not exist "%PKG_FOLDER%\%INPUT_ACT_DAT%" (
	echo. 
	echo ps3xploit_resign: '.\%INPUT_ACT_DAT%' not found, exiting...
	echo. 
	pause
	exit /b
)
copy /Y "%PKG_FOLDER%\%INPUT_ACT_DAT%" "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\"

:: Copy idps.hex files
if not exist "%PKG_FOLDER%\%INPUT_IDPS_HEX%" (
	echo. 
	echo ps3xploit_resign: '.\%INPUT_IDPS_HEX%' not found, exiting...
	echo. 
	pause
	exit /b
)
copy /Y "%PKG_FOLDER%\%INPUT_IDPS_HEX%" "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\"

:: Copy RAP files
copy /Y "%PKG_FOLDER%\%INPUT_RAPS_DIR%\*.rap" "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\"

:: Resign all RAP files to RIF files
if exist "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\*.rif" del "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\*.rif"
for %%I in ("%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\*.rap") do (
	cd "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\"
	echo y | "%CURRENT_DIR%\%TOOLS_RESIGNER%" "%%I"
	cd "%PKG_FOLDER%\"
)

:: Delete unneed files on PKG RIF
del "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\*.rap"
del "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\act.dat"
del "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\idps.hex"

:: Move 'signed_act.dat' to 'act.dat'
move "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\signed_act.dat" "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\act.dat"

:: Build PKG RIF
"%CURRENT_DIR%\%TOOLS_PKG_EXDATA%" --contentid %RIF_PKG_CONTENTID% %OUTPUT_TEMP_DIR%\ %OUTPUT_PKGS_DIR%\%RIF_PKG_NAME%

:: Resign PKG RIF
if not exist "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\%RIF_PKG_NAME%" (
	echo. 
	echo ps3xploit_resign: '.\%OUTPUT_PKGS_DIR%\%RIF_PKG_NAME%' not found, exiting...
	echo. 
	pause
	exit /b
)
echo y | "%CURRENT_DIR%\%TOOLS_RESIGNER%" "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\%RIF_PKG_NAME%"

:: Cleanup
del "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\*.rif"
del "%PKG_FOLDER%\%OUTPUT_TEMP_DIR%\act.dat"
del "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\%RIF_PKG_NAME%"

:: Resign PKG files
:RESIGN_PKG_ONLY
for %%I in ("%PKG_FOLDER%\%INPUT_PKGS_DIR%\*.pkg") do (
	echo y | "%CURRENT_DIR%\%TOOLS_RESIGNER%" "%%I"
	move "%%I_signed.pkg" "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\"
)

:: Output header
echo. 
echo ps3xploit_resign: Output files:

:: See PKGS signed
if exist "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\*.pkg" (
	echo. 
	echo.  PKGS:
	for %%I in ("%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\*.pkg") do (
		if "%%I" == "%PKG_FOLDER%\%OUTPUT_PKGS_DIR%\%RIF_PKG_NAME%_signed.pkg" (
			echo.    [RIF PKG] .\%%I
		) else (
			echo.    .\%%I
		)
	)
	echo. 
)
