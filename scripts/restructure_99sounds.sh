#!/bin/bash
set -uo pipefail
# Note: Removed -e to prevent early exit on minor errors

# ============================================================================
# 99Sounds Nature Library Restructuring Script
# ============================================================================
# Purpose: Reorganize Taiwan/Thailand nature sounds into optimal hierarchy
# for the Photic Prism soundscape engine.
#
# Rules:
# - Folders with >5 files must be partitioned into semantic subfolders
# - Follow app convention: lowercase_snake_case
# - Sequential versioning: _v01, _v02, etc.
# - Preserve location metadata in folder names
# - Maintain uppercase .WAV where present
# ============================================================================

SOURCE_DIR="src/assets/sounds/99Sounds Nature Sounds"
TARGET_DIR="src/assets/sounds/99sounds_restructured"
LOG_FILE="scripts/99sounds_restructure_log.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  99Sounds Nature Library Restructuring${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Initialize log
echo "=== 99Sounds Restructure Log ===" > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "Source: $SOURCE_DIR" >> "$LOG_FILE"
echo "Target: $TARGET_DIR" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Clean target directory if it exists
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}⚠ Target directory exists. Removing...${NC}"
    rm -rf "$TARGET_DIR"
fi

mkdir -p "$TARGET_DIR"

# Track statistics
declare -i TOTAL_FILES=0
declare -i MOVED_FILES=0
declare -A CLASS_COUNTS

# ============================================================================
# Helper Functions
# ============================================================================

log_move() {
    local src="$1"
    local dest="$2"
    echo "MOVE: $src → $dest" >> "$LOG_FILE"
    ((MOVED_FILES++))
}

create_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}✓${NC} Created: ${dir#$TARGET_DIR/}"
    fi
}

move_and_rename() {
    local source_file="$1"
    local target_subdir="$2"
    local base_name="$3"
    local version="$4"
    
    # Extract file extension (preserve case)
    local ext="${source_file##*.}"
    
    # Build target path
    local target_dir="$TARGET_DIR/$target_subdir"
    create_dir "$target_dir"
    
    local target_file="$target_dir/${base_name}_v${version}.${ext}"
    
    # Move file
    cp "$source_file" "$target_file"
    log_move "$source_file" "$target_file"
    
    # Update class count
    local class="${target_subdir%%/*}"
    ((CLASS_COUNTS[$class]=${CLASS_COUNTS[$class]:-0}+1))
}

# ============================================================================
# Category Processing Functions
# ============================================================================

process_amphibians() {
    echo -e "\n${BLUE}▶ Processing AMPHIBIANS${NC}"
    
    local target_path="amphibians/frogs_croaking_taiwan"
    local base_name="taiwan_frogs_village"
    local version=1
    
    for file in "$SOURCE_DIR"/Animals/ANMLAmph-*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$target_path" "$base_name" "$ver"
        ((version++))
    done
}

process_birds() {
    echo -e "\n${BLUE}▶ Processing BIRDS${NC}"
    
    local target_path="birds/crow_cawing_taiwan"
    local base_name="crow_taipei_park"
    local version=1
    
    # Crow calls (01, 02, 05)
    for file in "$SOURCE_DIR"/Animals/BIRDCrow-*Taiwan*.wav; do
        [ -f "$file" ] || continue
        if [[ ! "$file" =~ Wings ]]; then
            printf -v ver "%02d" $version
            move_and_rename "$file" "$target_path" "$base_name" "$ver"
            ((version++))
        fi
    done
    
    # Crow with wings
    for file in "$SOURCE_DIR"/Animals/BIRDCrow-*Wings*.wav; do
        [ -f "$file" ] || continue
        move_and_rename "$file" "$target_path" "crow_taipei_wings" "01"
    done
}

process_mammals() {
    echo -e "\n${BLUE}▶ Processing MAMMALS${NC}"
    
    local target_path="mammals/rodents/squirrel_vocals_taiwan"
    local base_name="squirrel_taipei_creek"
    local version=1
    
    for file in "$SOURCE_DIR"/Animals/ANMLRdnt-*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$target_path" "$base_name" "$ver"
        ((version++))
    done
}

process_ambience() {
    echo -e "\n${BLUE}▶ Processing AMBIENCE${NC}"
    
    local target_path="ambience/forest_night_thailand"
    local base_name="forest_cicadas_river"
    local version=1
    
    for file in "$SOURCE_DIR"/Forest/AMBForst-*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$target_path" "$base_name" "$ver"
        ((version++))
    done
}

process_weather() {
    echo -e "\n${BLUE}▶ Processing WEATHER${NC}"
    
    # Rain on forest
    local rain_path="weather/rain_forest_thailand"
    local rain_base="rain_leaves_cicadas"
    local version=1
    
    for file in "$SOURCE_DIR"/Rain/RAINMisc-*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$rain_path" "$rain_base" "$ver"
        ((version++))
    done
    
    # Wind - vegetation gentle (grass/reed)
    local wind_gentle_path="weather/wind/vegetation_gentle_taiwan"
    local wind_gentle_base="wind_grass_reed_taipei"
    version=1
    
    for file in "$SOURCE_DIR"/Wind/WINDVege-*Grass*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$wind_gentle_path" "$wind_gentle_base" "$ver"
        ((version++))
    done
    
    # Wind - vegetation beach
    local wind_beach_path="weather/wind/vegetation_beach_taiwan"
    local wind_beach_base="wind_waves_beach_taitung"
    version=1
    
    for file in "$SOURCE_DIR"/Wind/WINDVege-*Beach*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$wind_beach_path" "$wind_beach_base" "$ver"
        ((version++))
    done
    
    # Wind - vegetation lakeside
    local wind_lake_path="weather/wind/vegetation_lakeside_taiwan"
    local wind_lake_base="wind_lakeside_park_taitung"
    version=1
    
    for file in "$SOURCE_DIR"/Wind/WINDVege-*Lakeside*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$wind_lake_path" "$wind_lake_base" "$ver"
        ((version++))
    done
}

process_water() {
    echo -e "\n${BLUE}▶ Processing WATER${NC}"
    
    # Waterfall sounds
    local waterfall_path="water/waterfall_thailand"
    local version=1
    
    for file in "$SOURCE_DIR"/Water/WATRFall-*.WAV "$SOURCE_DIR"/Water/WATRFall-*.wav; do
        [ -f "$file" ] || continue
        
        # Determine variant based on content
        if [[ "$file" =~ Frogs ]]; then
            base_name="waterfall_forest_frogs"
        elif [[ "$file" =~ Birds.*Daytime\.WAV ]]; then
            base_name="waterfall_spray_birds"
        else
            base_name="waterfall_strong_spray"
        fi
        
        printf -v ver "%02d" $version
        move_and_rename "$file" "$waterfall_path" "$base_name" "$ver"
        ((version++))
    done
    
    # River flow
    local flow_path="water/river_flow"
    version=1
    
    # Taiwan river flows
    for file in "$SOURCE_DIR"/Water/WATRFlow-*Taiwan*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$flow_path/taiwan" "river_calm_taipei" "$ver"
        ((version++))
    done
    
    # Thailand river flows
    version=1
    for file in "$SOURCE_DIR"/Water/WATRFlow-*Thailand*.wav; do
        [ -f "$file" ] || continue
        
        if [[ "$file" =~ Rooster ]]; then
            base_name="river_birds_rooster"
        elif [[ "$file" =~ Evening ]]; then
            base_name="river_cicadas_evening"
        else
            base_name="river_birds_daytime"
        fi
        
        printf -v ver "%02d" $version
        move_and_rename "$file" "$flow_path/thailand" "$base_name" "$ver"
        ((version++))
    done
    
    # Splash/creek textures
    local splash_path="water/splash_creek_taiwan"
    version=1
    
    # Alishan creek splashes without rooster
    for file in "$SOURCE_DIR"/Water/WATRSplsh-*Alishan*.wav; do
        [ -f "$file" ] || continue
        
        if [[ "$file" =~ Rooster ]]; then
            base_name="creek_splash_rooster"
        else
            base_name="creek_splash_texture"
        fi
        
        printf -v ver "%02d" $version
        move_and_rename "$file" "$splash_path" "$base_name" "$ver"
        ((version++))
    done
    
    # Forest ambient with river
    local ambient_path="water/ambient_birdsong_thailand"
    local ambient_base="forest_river_birds"
    version=1
    
    for file in "$SOURCE_DIR"/Water/AMBForst-*.wav; do
        [ -f "$file" ] || continue
        printf -v ver "%02d" $version
        move_and_rename "$file" "$ambient_path" "$ambient_base" "$ver"
        ((version++))
    done
}

# ============================================================================
# Main Execution
# ============================================================================

echo -e "${YELLOW}Scanning source directory...${NC}"
TOTAL_FILES=$(find "$SOURCE_DIR" -type f \( -name "*.wav" -o -name "*.WAV" \) | wc -l)
echo -e "Found ${GREEN}$TOTAL_FILES${NC} audio files\n"

# Process each category
process_amphibians
process_birds
process_mammals
process_ambience
process_weather
process_water

# Copy ABOUT.txt for provenance
if [ -f "$SOURCE_DIR/ABOUT.txt" ]; then
    cp "$SOURCE_DIR/ABOUT.txt" "$TARGET_DIR/ABOUT.txt"
    echo -e "\n${GREEN}✓${NC} Copied ABOUT.txt"
fi

# ============================================================================
# Summary Report
# ============================================================================

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Restructuring Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total files processed: ${GREEN}$MOVED_FILES${NC} / $TOTAL_FILES"
echo ""
echo -e "${YELLOW}Files by class:${NC}"

for class in "${!CLASS_COUNTS[@]}"; do
    echo -e "  • ${class}: ${CLASS_COUNTS[$class]} files"
done | sort

echo ""
echo -e "Output directory: ${GREEN}$TARGET_DIR${NC}"
echo -e "Migration log: ${BLUE}$LOG_FILE${NC}"
echo ""

# Final directory tree
echo -e "${YELLOW}Directory structure:${NC}"
echo ""
tree -L 3 -F "$TARGET_DIR" 2>/dev/null || find "$TARGET_DIR" -type d | sed 's|[^/]*/| |g;s|^ ||' | head -30

echo ""
echo -e "${GREEN}✓ Done!${NC}"
echo ""
