interface StatThresholds {
  mean: number;
  stdDev: number;
}

interface CellStyle {
  backgroundColor: string;
  color: string;
}

interface ZScoreThresholds {
  excellent: number;
  good: number;
  above: number;
  below: number;
  poor: number;
}

const statTypeThresholds: { [key: string]: ZScoreThresholds } = {
  default: {
    excellent: 2.5,
    good: 2.0,
    above: 1.5,
    below: -1.0,
    poor: -2.0,
  },
  efficiency: {
    excellent: 1.8,
    good: 1.2,
    above: 0.6,
    below: -0.6,
    poor: -1.8,
  },
  usage: {
    excellent: 2.0,
    good: 1.5,
    above: 0.75,
    below: -0.75,
    poor: -1.5,
  },
  turnover: {
    excellent: 1.5,
    good: 1.25,
    above: 0.85,
    below: -0.8,
    poor: -1.2,
  },
};


function getZScoreStyle(zScore: number, statType: 'default' | 'efficiency' | 'usage' | 'turnover' | 'stealPercentage' = 'default'): CellStyle {
  const thresholds = statTypeThresholds[statType];

  if (zScore >= thresholds.excellent) {
    return {
      backgroundColor: 'rgb(0, 88, 0)', // Darker green
      color: 'white',
    };
  } else if (zScore >= thresholds.good) {
    return {
      backgroundColor: 'rgb(66, 194, 66)', // Medium green
      color: 'black',
    };
  } else if (zScore >= thresholds.above) {
    return {
      backgroundColor: 'rgb(171, 255, 171)', // Light green
      color: 'black',
    };
  } else if (zScore <= thresholds.poor) {
    return {
      backgroundColor: 'rgb(255, 71, 71)', // Dark red
      color: 'black',
    };
  } else if (zScore <= thresholds.below) {
    return {
      backgroundColor: 'rgb(255, 150, 150)', // Light red
      color: 'black',
    };
  } else {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }
}

// Calculate mean and standard deviation for a specific stat
function calculateThresholds(data: any[], statKey: string): StatThresholds {
  // Filter out invalid values
  const validValues = data
    .map((item) => {
      const val = Number(item[statKey]);
      // If it's a percentage field stored as decimal (0-1), multiply by 100
      if (statKey.toLowerCase().includes('percentage') && val <= 1) {
        return val * 100;
      }
      return val;
    })
    .filter((val) => !isNaN(val) && val !== null);

  const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;

  // Calculate standard deviation
  const squareDiffs = validValues.map((val) => Math.pow(val - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / validValues.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return { mean, stdDev };
}

// Special handling for shooting percentages with different thresholds for each type
function getShootingPercentageStyle(value: number, attempts: number, type: 'three' | 'two' | 'rim' | 'midRange' | 'ft'): CellStyle {
  if (isNaN(value) || value === null) {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }

  // For 0% in eFG% and TS%, show as red since it means they're not scoring at all
  if (value === 0 && attempts === 999) {
    return {
      backgroundColor: 'rgb(255, 71, 71)', // Dark red
      color: 'black',
    };
  }

  // For other shooting stats, don't color grade if no attempts
  if (value === 0 && attempts < 1) {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }

  // Minimum attempts required for full color grading
  const minAttempts = {
    three: 20,
    two: 30,
    rim: 20,
    midRange: 20,
    ft: 15,
  };

  const excellentThresholds = {
    three: 38,
    two: 52,   
    rim: 65,  
    midRange: 45, 
    ft: 85,   
  };

  const goodThresholds = {
    three: 34, 
    two: 48,  
    rim: 60,  
    midRange: 40, 
    ft: 80, 
  };

  // Average thresholds for each shot type
  const avgThresholds = {
    three: 30, 
    two: 44,  
    rim: 55, 
    midRange: 35, 
    ft: 75,   
  };

  // Poor thresholds for each shot type
  const poorThresholds = {
    three: 26,
    two: 38,  
    rim: 50, 
    midRange: 30,
    ft: 65, 
  };

  const attemptsRatio = Math.min(attempts / minAttempts[type], 1);

  let baseStyle: CellStyle;
  if (value >= excellentThresholds[type]) {
    baseStyle = {
      backgroundColor: 'rgb(0, 88, 0)',
      color: 'white',
    };
  } else if (value >= goodThresholds[type]) {
    baseStyle = {
      backgroundColor: 'rgb(66, 194, 66)',
      color: 'black',
    };
  } else if (value >= avgThresholds[type]) {
    baseStyle = {
      backgroundColor: 'rgb(171, 255, 171)',
      color: 'black',
    };
  } else if (value <= poorThresholds[type]) {
    baseStyle = {
      backgroundColor: 'rgb(255, 71, 71)',
      color: 'black',
    };
  } else {
    baseStyle = {
      backgroundColor: 'rgb(255, 150, 150)',
      color: 'black',
    };
  }

  return baseStyle;
}

function getPercentageStyle(value: number, statKey?: string): CellStyle {
  if (isNaN(value) || value === null) {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }

  const thresholds = {
    offensiveReboundPercentage: {
      excellent: 10,
      good: 7,
      average: 4.5,
      belowAverage: 2.5,
      poor: 1.5,
    },
    defensiveReboundPercentage: {
      excellent: 20,
      good: 17,
      average: 14,
      belowAverage: 10,
      poor: 6,
    },
    assistPercentage: {
      excellent: 30,
      good: 25,
      average: 18,
      belowAverage: 10,
      poor: 5,
    },
    stealPercentage: {
      excellent: 5,
      good: 4,
      average: 3,
      belowAverage: 1.5,
      poor: 1,
    },

    default: {
      excellent: 25,
      good: 20,
      average: 15,
      belowAverage: 12,
      poor: 10,
    },
  };

  let currentThresholds;
  if (statKey && thresholds[statKey as keyof typeof thresholds]) {
    currentThresholds = thresholds[statKey as keyof typeof thresholds];
  } else {
    currentThresholds = thresholds.default;
  }

  if (value >= currentThresholds.excellent) {
    return {
      backgroundColor: 'rgb(0, 88, 0)', // Darker green
      color: 'white',
    };
  } else if (value >= currentThresholds.good) {
    return {
      backgroundColor: 'rgb(66, 194, 66)', // Medium green
      color: 'black',
    };
  } else if (value >= currentThresholds.average) {
    return {
      backgroundColor: 'rgb(171, 255, 171)', // Light green
      color: 'black',
    };
  } else if (value >= currentThresholds.belowAverage) {
    return {
      backgroundColor: '#171717', // Neutral
      color: 'white',
    };
  } else if (value <= currentThresholds.poor) {
    return {
      backgroundColor: 'rgb(255, 71, 71)', // Dark red
      color: 'black',
    };
  } else {
    return {
      backgroundColor: 'rgb(255, 150, 150)', // Light red
      color: 'black',
    };
  }
}


export function getStatStyle(value: number, thresholds: StatThresholds | undefined, statKey?: string, attempts?: number): CellStyle {
  if (isNaN(value) || value === null) {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }

  if (statKey && (statKey === 'fgPercentage' || statKey === 'fg3Percentage' || statKey === 'ftPercentage') && thresholds) {
      if (value === 100) {
          return {
              backgroundColor: 'rgb(0, 88, 0)',
              color: 'white',
          };
      }

      const zScore = (value - thresholds.mean) / thresholds.stdDev;

      if (statKey === 'ftPercentage') {
          if (zScore >= 1.2) {
              return {
                  backgroundColor: 'rgb(0, 88, 0)',
                  color: 'white',
              };
          } else if (zScore >= 0.8 && zScore < 1.2) {
              return {
                  backgroundColor: 'rgb(66, 194, 66)',
                  color: 'black',
              };
          } else if (zScore >= 0.4 && zScore < 0.8) {
              return {
                  backgroundColor: 'rgb(171, 255, 171)',
                  color: 'black',
              };
          } else if (zScore > -0.4 && zScore < 0.4) {
              return {
                  backgroundColor: '#171717', 
                  color: 'white',
              };
          } else if (zScore > -0.8 && zScore <= -0.4) { 
              return {
                  backgroundColor: 'rgb(255, 150, 150)',
                  color: 'black',
              };
          } else if (zScore <= -0.8) {
              return {
                  backgroundColor: 'rgb(255, 71, 71)',
                  color: 'black',
              };
          }
      } else {
          if (zScore >= 1.5) {
              return {
                  backgroundColor: 'rgb(0, 88, 0)', 
                  color: 'white',
              };
          } else if (zScore >= 1.0 && zScore < 1.5) {
              return {
                  backgroundColor: 'rgb(66, 194, 66)', 
                  color: 'black',
              };
          } else if (zScore >= 0.5 && zScore < 1.0) {
              return {
                  backgroundColor: 'rgb(171, 255, 171)', 
                  color: 'black',
              };
          } else if (zScore > -0.5 && zScore < 0.5) {
              return {
                  backgroundColor: '#171717',
                  color: 'white',
              };
          } else if (zScore > -1.0 && zScore <= -0.5) {
              return {
                  backgroundColor: 'rgb(255, 150, 150)',
                  color: 'black',
              };
          } else if (zScore <= -1.0) {
              return {
                  backgroundColor: 'rgb(255, 71, 71)',
                  color: 'black',
              };
          }
      }
       return {
          backgroundColor: '#171717',
          color: 'white',
        };
  }

  if (thresholds && statKey !== 'usage') {
      const zScore = (value - thresholds.mean) / thresholds.stdDev;

      if (statKey === 'turnovers') {
          const invertedZScore = -zScore;
          if (invertedZScore >= 1.2) {
              return {
                  backgroundColor: 'rgb(0, 88, 0)', 
                  color: 'white',
              };
          } else if (invertedZScore >= 0.8 && invertedZScore < 1.2) {
              return {
                  backgroundColor: 'rgb(66, 194, 66)',
                  color: 'black',
              };
          } else if (invertedZScore >= 0.4 && invertedZScore < 0.8) {
              return {
                  backgroundColor: 'rgb(171, 255, 171)',
                  color: 'black',
              };
          } else if (invertedZScore > -0.4 && invertedZScore < 0.4) {
              return {
                  backgroundColor: '#171717',
                  color: 'white',
              };
          } else if (invertedZScore > -0.8 && invertedZScore <= -0.4) {
              return {
                  backgroundColor: 'rgb(255, 150, 150)',
                  color: 'black',
              };
          } else if (invertedZScore <= -0.8) {
              return {
                  backgroundColor: 'rgb(255, 71, 71)',
                  color: 'black',
              };
          }
      }

      if (statKey === 'effectiveFGPercentage' || statKey === 'trueShootingPercentage') {
          if (zScore >= 2.2) {
              return {
                  backgroundColor: 'rgb(0, 88, 0)',
                  color: 'white',
              };
          } else if (zScore >= 1.8 && zScore < 2.2) {
              return {
                  backgroundColor: 'rgb(66, 194, 66)',
                  color: 'black',
              };
          } else if (zScore >= 1.2 && zScore < 1.8) {
              return {
                  backgroundColor: 'rgb(171, 255, 171)',
                  color: 'black',
              };
          } else if (zScore > -1.2 && zScore < 1.2) {
              return {
                  backgroundColor: '#171717',
                  color: 'white',
              };
          } else if (zScore > -1.8 && zScore <= -1.2) {
              return {
                  backgroundColor: 'rgb(255, 150, 150)',
                  color: 'black',
              };
          } else if (zScore <= -1.8) {
              return {
                  backgroundColor: 'rgb(255, 71, 71)',
                  color: 'black',
              };
          }
      }

      // Original thresholds for other stats
      if (zScore >= 2.0) {
          return {
              backgroundColor: 'rgb(0, 88, 0)', // Darker green (Excellent)
              color: 'white',
          };
      } else if (zScore >= 1.5 && zScore < 2.0) { // Medium Green (Good)
          return {
              backgroundColor: 'rgb(66, 194, 66)', // Medium green
              color: 'black',
          };
      } else if (zScore >= 1.0 && zScore < 1.5) { // Light Green (Above Average)
          return {
              backgroundColor: 'rgb(171, 255, 171)', // Light green
              color: 'black',
          };
      } else if (zScore > -1.0 && zScore < 1.0) { // Neutral (No Color)
          return {
              backgroundColor: '#171717',
              color: 'white',
          };
      } else if (zScore > -1.5 && zScore <= -1.0) { // Light Red (Below Average)
          return {
              backgroundColor: 'rgb(255, 150, 150)', // Light red
              color: 'black',
          };
      } else if (zScore <= -1.5) { // Dark Red (Poor)
          return {
              backgroundColor: 'rgb(255, 71, 71)', // Dark red
              color: 'black',
          };
      }
       // Fallback to neutral if somehow none of the above matched (shouldn't happen with full coverage)
        return {
            backgroundColor: '#171717',
            color: 'white',
        };
  }

  if (statKey) {
    if (statKey === 'offensiveReboundPercentage' || statKey === 'defensiveReboundPercentage' || statKey === 'assistPercentage' || statKey === 'stealPercentage') {
      return getPercentageStyle(value, statKey);
    }

    if (statKey === 'freeThrowPercentage' || statKey === 'twoPPercentage' || statKey === 'threePPercentage' || statKey === 'rimPercentage' || statKey === 'midRangePercentage') {
      if (!thresholds) {
          return getShootingPercentageStyle(
            value,
            attempts || 0,
            statKey.toLowerCase().includes('three')
              ? 'three'
              : statKey.toLowerCase().includes('two')
              ? 'two'
              : statKey.toLowerCase().includes('rim')
              ? 'rim'
              : statKey.toLowerCase().includes('midrange')
              ? 'midRange'
              : 'ft'
          );
      }
    }
  }

  const isVolumeBasedStat = false;

  if ((isVolumeBasedStat || !statKey) && value <= 1) {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }

  if ((statKey === 'twoPMade' || statKey === 'threePMade') && attempts && attempts > 0) {
    const percentage = value / attempts;
    if (percentage <= 0.25) {
      return {
        backgroundColor: 'rgb(255, 71, 71)', // Dark red
        color: 'black',
      };
    } else if (percentage <= 0.35) {
      return {
        backgroundColor: 'rgb(255, 150, 150)', // Light red
        color: 'black',
      };
    }
  }

  const isShootingRelated =
    statKey?.toLowerCase().includes('threep') ||
    statKey?.toLowerCase().includes('twop') ||
    statKey?.toLowerCase().includes('rim') ||
    statKey?.toLowerCase().includes('midrange') ||
    statKey?.toLowerCase().includes('freethrow');

  if (value === 0 && isShootingRelated) {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }

  return {
    backgroundColor: '#171717',
    color: 'white',
  };
}

export function calculateAllThresholds(data: any[]) {
  const isWNBA = data.length > 0 && 'fgMade' in data[0];
  
  if (isWNBA) {
    return calculateWNBAThresholds(data);
  }

  // NCAAW stats
  const statsToAnalyze = [
    'offensiveRating',
    'turnoverPercentage',
    'effectiveFGPercentage',
    'trueShootingPercentage',
    'porpag',
    'adjoe',
    'assistToTurnover',
    'defensiveRating',
    'adjustedDefensiveRating',
    'defensivePorpag',
    'boxPlusMinus',
    'offensiveBoxPlusMinus',
    'defensiveBoxPlusMinus',
    'gameBoxPlusMinus',
    'offensiveGameBoxPlusMinus',
    'defensiveGameBoxPlusMinus',
    'usage',
    'threePPer100',
    'freeThrowsMade',
    'freeThrowsAttempted',
    'twoPMade',
    'twoPAttempted',
    'threePMade',
    'threePAttempted',
    'rimMakes',
    'rimAttempts',
    'midRangeMakes',
    'midRangeAttempts',
    'offensiveRebounds',
    'defensiveRebounds',
    'totalRebounds',
    'assists',
    'steals',
    'blocks',
    'points',
    'minutesPerGame',
    'gamesPlayed',

    'freeThrowPercentage',
    'twoPPercentage',
    'threePPercentage',
    'rimPercentage',
    'midRangePercentage'
  ];

  const thresholds: { [key: string]: StatThresholds } = {};
  statsToAnalyze.forEach(stat => {
    thresholds[stat] = calculateThresholds(data, stat);
  });
  return thresholds;
}

// Calculate thresholds specifically for WNBA stats
function calculateWNBAThresholds(data: any[]) {
  const statsToAnalyze = [
    'fgMade',
    'fgAttempted',
    'fgPercentage',
    'fg3Made',
    'fg3Attempted',
    'fg3Percentage',
    'ftMade',
    'ftAttempted',
    'ftPercentage',
    'turnovers',
    'efficiency',
    'rebounds',
    'offensiveRebounds',
    'defensiveRebounds',
    'points',
    'assists',
    'steals',
    'blocks',
    'minutes',
    'gamesPlayed'
  ];

  const thresholds: { [key: string]: StatThresholds } = {};
  statsToAnalyze.forEach(stat => {
    thresholds[stat] = calculateThresholds(data, stat);
  });
  return thresholds;
}

// Special handling for turnover percentage (lower is better)
export function getTurnoverStyle(value: number, thresholds: StatThresholds): CellStyle {
  if (isNaN(value) || value === null) {
    return {
      backgroundColor: '#171717',
      color: 'white',
    };
  }

  if (value === 0) {
    return {
      backgroundColor: 'rgb(0, 88, 0)',
      color: 'white',
    };
  }

  // Invert the z-score since lower turnover percentage is better
  const zScore = (thresholds.mean - value) / thresholds.stdDev;
  // Use turnover-specific thresholds
  return getZScoreStyle(zScore, 'turnover');
}

// Special handling for defensive ratings (lower is better)
export function getDefensiveStyle(value: number, thresholds: StatThresholds): CellStyle {
  if (isNaN(value) || value === null || value === 0) {
    return {
      backgroundColor: '#171717', // neutral-900 instead of transparent
      color: 'white', // changed from black to white for visibility
    };
  }

  // Invert the z-score since lower defensive rating is better
  const zScore = (thresholds.mean - value) / thresholds.stdDev;
  return getZScoreStyle(zScore);
}

// Stat descriptions for tooltips
export const statDescriptions: { [key: string]: string } = {
  minutesPercentage: "% of team's total minutes played",
  offensiveRating: 'Points scored per 100 possessions',
  usage: '% of team plays used while on court',
  effectiveFGPercentage: 'FG% adjusted for 3-pointers',
  trueShootingPercentage: 'Shooting % including FTs and 3s',
  offensiveReboundPercentage: '% of offensive rebounds grabbed',
  defensiveReboundPercentage: '% of defensive rebounds grabbed',
  assistPercentage: '% of teammate FGs assisted',
  turnoverPercentage: 'Turnovers per 100 plays',
  freeThrowPercentage: 'Free throw %',
  twoPPercentage: '2-point FG%',
  threePPercentage: '3-point FG%',
  blockPercentage: '% of opponent 2pt shots blocked',
  stealPercentage: '% of opponent possessions stolen',
  porpag: 'Points above replacement per game',
  adjoe: 'Adjusted offensive efficiency',
  assistToTurnover: 'Assists per turnover',
  rimPercentage: 'FG% at the rim',
  midRangePercentage: 'FG% on mid-range shots',
  defensiveRating: 'Points allowed per 100 possessions',
  adjustedDefensiveRating: 'Defensive rating vs. strength of schedule',
  defensivePorpag: 'Defensive points above replacement',
  boxPlusMinus: 'Box Plus Minus (Overall impact per 100 possessions)',
  offensiveBoxPlusMinus: 'Offensive Box Plus Minus',
  defensiveBoxPlusMinus: 'Defensive Box Plus Minus',
  gameBoxPlusMinus: 'Game Box Plus Minus',
  offensiveGameBoxPlusMinus: 'Offensive Game Box Plus Minus',
  defensiveGameBoxPlusMinus: 'Defensive Game Box Plus Minus',
  threePPer100: '3-pointers made per 100 possessions',
  freeThrowsMade: 'Total free throws made in the season',
  freeThrowsAttempted: 'Total free throw attempts in the season',
  twoPMade: 'Total 2-point field goals made in the season',
  twoPAttempted: 'Total 2-point field goal attempts in the season',
  threePMade: 'Total 3-point field goals made in the season',
  threePAttempted: 'Total 3-point field goal attempts in the season',
  foulRate: 'Average number of fouls committed per 100 possessions',
  rimMakes: 'Total field goals made at the rim',
  rimAttempts: 'Total field goal attempts at the rim',
  midRangeMakes: 'Total mid-range jump shots made',
  midRangeAttempts: 'Total mid-range jump shot attempts',
  offensiveRebounds: 'Total offensive rebounds in the season',
  defensiveRebounds: 'Total defensive rebounds in the season',
  totalRebounds: 'Total combined rebounds in the season',
  assists: 'Total assists in the season',
  steals: 'Total steals in the season',
  blocks: 'Total blocks in the season',
  points: 'Total points scored in the season',
};
