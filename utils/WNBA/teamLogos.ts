export const getTeamLogoUrl = (teamAbbr: string): string => {
  const baseUrl = 'https://a.espncdn.com/i/teamlogos/wnba/500';

  const teamLogoMap: { [key: string]: string } = {
    ATL: 'atl',
    CHI: 'chi',
    CON: 'conn',
    DAL: 'dal',
    GSV: 'gsv',
    IND: 'ind',
    LV: 'lv',
    LVA: 'lv',
    LA: 'la',
    LAS: 'la',
    MIN: 'min',
    NY: 'ny',
    NYL: 'ny',
    PHO: 'phx',
    PHX: 'phx',
    SEA: 'sea',
    WAS: 'was',
    WSH: 'was',
  };

  const logoIdentifier = teamLogoMap[teamAbbr];
  return logoIdentifier ? `${baseUrl}/${logoIdentifier}.png` : defaultWnbaLogo;
};

export const defaultWnbaLogo = 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png';
