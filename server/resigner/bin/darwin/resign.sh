#!/bin/bash

#
# Copyright 2018 Caio Oliveira
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# PS3Xploit ReSign BASH Script for act.dat, PKG and RAP
# Thanks to @CaptainCPS-X for script to build a proper PKG using Python
function ps3xploit_resign() {

  # Main Exports
  export PS3XPLOIT_RESIGNER_BINARY=;
  export PS3XPLOIT_PKGPY_BINARY=;
  export PS3XPLOIT_PYTHON_BINARY=;


  rap_signed_file_name=$2;
  pkg_folder=$3;

  # Save Current Working Dir and Create a TEMPorary DIR
  cwd=$1;

  # Main tools
  ps3py_tools_dir="${cwd}/server/resigner/bin/darwin/ps3py";

  # Output dirs
  output_pkgs_dir="${pkg_folder}/resigner/output/pkgs";

  # Input files
  input_act_dat="${pkg_folder}/resigner/consoles/default/act.dat";
  input_idps_hex="${pkg_folder}/resigner/consoles/default/idps.hex";

  # Input dirs
  input_raps_dir="${pkg_folder}/resigner/input/raps"
  input_pkgs_dir="${pkg_folder}/resigner/input/pkgs"

  # RIF Package ContentID and Name
  rif_pkg_contentid="RIF000-LSINSTALL_00-0000000000000000";


  # contenId / contentId-name
  rif_pkg_name="${output_pkgs_dir}/${rap_signed_file_name}.rif.pkg";

  echo $rif_pkg_name;
  
  ###
  ### Check
  ###

  # Search for *.rap files
  input_raps_files=($(find "${input_raps_dir}/" -maxdepth 1 -type f \( -iname \*.rap -o -iname \*.RAP \)));
  input_raps_size="${#input_raps_files[@]}";
  if [ "${input_raps_size}" -eq 0 ]; then
    echo;
    echo "ps3xploit_resign: No '*.rap' files found on '.${input_raps_dir##${cwd}}'";
    echo;
  fi;

  # Check 'act.dat' and 'idps.hex' only when resign RAP files
  if [ "${input_raps_size}" -gt 0 ]; then
    for IFC in ${input_act_dat} ${input_idps_hex}; do
      if [ ! -e "${IFC}" ]; then
		echo;
        echo "ps3xploit_resign: '.${IFC##${cwd}}' not found, exiting...";
		echo;
        return;
      fi;
    done;
  fi;

  # Search for *.pkg files
  input_pkgs_files=($(find "${input_pkgs_dir}/" -maxdepth 1 -name "*.pkg"));
  input_pkgs_size="${#input_pkgs_files[@]}";
  if [ "${input_pkgs_size}" -eq 0 ]; then
    echo;
    echo "ps3xploit_resign: No '*.pkg' files found on '.${input_pkgs_dir##${cwd}}'";
    echo;
  fi;

  # Nothing to do, just exit
  if [ "${input_raps_size}" -eq 0 -a "${input_pkgs_size}" -eq 0 ]; then
    return;
  fi;

  cd "${cwd}";

  PS3XPLOIT_RESIGNER_BINARY="${cwd}/server/resigner/bin/darwin/ps3xploit_rifgen_edatresign";

  ###
  ### Start - RIF
  ###

  # Use only when resign RAP files
  if [ "${input_raps_size}" -gt 0 ]; then

    # Check 'pkg.py'
    PS3XPLOIT_PKGPY_BINARY="${ps3py_tools_dir}/pkg.py";

    # Check if the Python2.7 is installed
    PS3XPLOIT_PYTHON_BINARY=$(which python2.7);
    # if [ -z "${PS3XPLOIT_PYTHON_BINARY}" ]; then
    #   echo;
    #   echo "ps3xploit_ps3py_all: 'python2.7' not is installed, exiting...";
    #   echo "                     To continue install 'python2.7'";
    #   echo;
    #   return;
    # fi;

    # Create a TEMPorary DIR
    temp_dir=$(mktemp -d);

    # Copy 'act.dat' and 'idps.hex'
    for IFC in ${input_act_dat} ${input_idps_hex}; do
      cp "${IFC}" "${temp_dir}/";
    done;

    # Sign RIF files
    for ((srap=0; srap<input_raps_size; srap++)); do

      # Copy Input RAP file to temp_dir
      cp "${input_raps_files[${srap}]}" "${temp_dir}/";

      # Remove input_raps_dir
      output_rifs_files["${srap}"]="${input_raps_files[${srap}]##${input_raps_dir}/}";

      # Extract file extension
      output_rifs_extension["${srap}"]=${output_rifs_files[${srap}]##*.}

      # Go to temp dir
      cd "${temp_dir}";

      # Sign the RIF file
      ${PS3XPLOIT_RESIGNER_BINARY} "${temp_dir}/${output_rifs_files[${srap}]}" <<< echo -e '\n\n';

      # Return back to current dir
      cd "${cwd}";

      # Remove RAP file
      rm -rf "${temp_dir}/${output_rifs_files[${srap}]:?}";

      # Change variable from .rap to .rif extension
      output_rifs_files["${srap}"]="${output_rifs_files[${srap}]%.${output_rifs_extension}}.rif";
    done;

    # Remove 'act.dat'/'idps.hex' and move 'signed_act.dat' to 'act.dat'
    rm -rf "${temp_dir}/act.dat" "${temp_dir}/idps.hex";
    mv "${temp_dir}/signed_act.dat" "${temp_dir}/act.dat";

    # Make PKG with all RIF files and ReSigned 'act.dat'
    ${PS3XPLOIT_PYTHON_BINARY} "${PS3XPLOIT_PKGPY_BINARY}" --contentid "${rif_pkg_contentid}" "${temp_dir}/" "${rif_pkg_name}";

    # Resign the new RIF PKG [HACK: Send 2 lines to PKG RESIGNER]
    ${PS3XPLOIT_RESIGNER_BINARY} "${rif_pkg_name}" <<< echo -e '\n\n';

    # Cleanup
    rm -rf "${rif_pkg_name}" "${temp_dir:?}/";

    # Update variable
    rif_pkg_name="${rif_pkg_name}_signed.pkg";
  fi;

  ###
  ### Start PKG
  ###

  # Sign PKG files
  for ((spkg=0; spkg<input_pkgs_size; spkg++)); do

    # Sign the PKG file
    ${PS3XPLOIT_RESIGNER_BINARY} "${input_pkgs_files[${spkg}]}" <<< echo -e '\n\n';

    # Remove input_pkgs_dir
    output_pkgs_files["${spkg}"]="${input_pkgs_files[${spkg}]##${input_pkgs_dir}/}_signed.pkg";

    # Copy Input RAP file to output_pkgs_dir
    mv "${input_pkgs_dir}/${output_pkgs_files[${spkg}]}" "${output_pkgs_dir}/";
  done;

  ###
  ### End
  ###

  # Output something
  echo;
  echo 'ps3xploit_resign: Output files:';

  # Use only when resign RAP files
  if [ "${input_raps_size}" -gt 0 ]; then
    echo;
    echo "  RIF PKG:";
    echo "    .${rif_pkg_name##${cwd}}";
    echo;
  fi;

  # Use only when resign PKG files
  if [ "${input_pkgs_size}" -gt 0 ]; then
    echo "  PKGS:";
    for ((spkg=0; spkg<input_pkgs_size; spkg++)); do
      echo "    .${output_pkgs_dir##${cwd}}/${output_pkgs_files[${spkg}]}";
    done;
    echo;
  fi;
}


# Execute it!
ps3xploit_resign $1 $2 $3;
