const truncate = (address: string, length: number) =>
  `${address.substring(0, length)}...`;

export default truncate;
