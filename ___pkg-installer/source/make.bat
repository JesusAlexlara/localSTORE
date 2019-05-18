@ECHO OFF
title make_package_custom

:: Save Current Working Dir
set CURRENT_DIR=%cd%

:: clean dirs
del "%CURRENT_DIR%\resigner\input\pkgs" /q
del "%CURRENT_DIR%\resigner\output\pkgs" /q

:: ----------------------------------------------
:: Simple script to build a PKG (by CaptainCPS-X)
:: ----------------------------------------------


:: ----------------------------------------------
:: HDD HEN ICON VERSION
:: ----------------------------------------------
set CID=CUSTOM-INSTALLER_00-0000000000000000
set PKG_DIR=./custom-hdd/
set PKG_NAME=localSTORE-installer-HDD-v1.0.0.pkg

make_package_custom.exe --contentid %CID% %PKG_DIR% %PKG_NAME%

copy "%CURRENT_DIR%\%PKG_NAME%" "%CURRENT_DIR%\resigner\input\pkgs"
del "%CURRENT_DIR%\%PKG_NAME%" /q

:: ----------------------------------------------
:: USB HEN ICON VERSION
:: ----------------------------------------------
set CID=CUSTOM-INSTALLER_00-0000000000000000
set PKG_DIR=./custom-usb/
set PKG_NAME=localSTORE-installer-USB-v1.0.0.pkg

make_package_custom.exe --contentid %CID% %PKG_DIR% %PKG_NAME%

copy "%CURRENT_DIR%\%PKG_NAME%" "%CURRENT_DIR%\resigner\input\pkgs"
del "%CURRENT_DIR%\%PKG_NAME%" /q

:: Resign pkgs

cd resigner

call resign_windows.bat



