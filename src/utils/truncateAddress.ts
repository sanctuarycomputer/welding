const truncateAddress = (address: string) =>
  `${address.substring(0, 6)}...`;

export default truncateAddress;

