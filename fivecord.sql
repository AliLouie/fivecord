
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


CREATE DATABASE IF NOT EXISTS `fivecord` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `fivecord`;

-- --------------------------------------------------------

--
-- Table structure for table `guilds`
--

CREATE TABLE `guilds` (
  `guild_id` varchar(255) DEFAULT NULL,
  `guild_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `guilds`
--

INSERT INTO `guilds` (`guild_id`, `guild_name`) VALUES
('925009058740707408', 'AliCCR\'s server'),
('925009058740707408', 'AliCCR\'s server'),
('925009058740707408', 'AliCCR\'s server');

-- --------------------------------------------------------

--
-- Table structure for table `ip_list`
--

CREATE TABLE `ip_list` (
  `ip_address` varchar(255) NOT NULL,
  `port` varchar(255) NOT NULL DEFAULT '30120',
  `discord_channel_id` varchar(255) NOT NULL,
  `server_name` varchar(255) NOT NULL DEFAULT 'undefined',
  `server_description` varchar(255) NOT NULL DEFAULT 'undefined',
  `server_tag` varchar(255) NOT NULL DEFAULT 'ir',
  `is_online` varchar(255) DEFAULT '0',
  `server_gamebuild` varchar(255) DEFAULT 'undefined',
  `player_count` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_persian_ci NOT NULL DEFAULT '0',
  `monitor` tinyint(1) DEFAULT 1,
  `server_cfx` varchar(255) NOT NULL DEFAULT 'https://servers.fivem.net/',
  `is_hide` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ip_list`
--

INSERT INTO `ip_list` (`ip_address`, `port`, `discord_channel_id`, `server_name`, `server_description`, `server_tag`, `is_online`, `server_gamebuild`, `player_count`, `monitor`, `server_cfx`, `is_hide`) VALUES
('188.34.182.251', '30120', '1155222596900638781', '^4Tedeapolis', 'RolePlay', 'esx, roleplay, TDA, serieus, essentialmode, NL, BE, tda-gaming, rp, dutch, nederlands, belgie, nederland, banen, crimineel, huizen, ambulance, politie, taxi, anwb, realistische prijzen, Trackyserver34292', '1', '2699', '376', 1, 'https://servers.fivem.net/', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ip_list`
--
ALTER TABLE `ip_list`
  ADD PRIMARY KEY (`discord_channel_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
