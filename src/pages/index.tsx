import Button from 'src/components/Button';

const Home = () => {
  return (
    <>
      <nav className="fixed w-full left-0 top-0 p-4 flex justify-between nav-blur">
        <p className="font-semibold pt-1">
          👩‍🏭 Welding
        </p>
        <a
          target="_blank"
          href="https://twitter.com/welding_app"
          className="Button font-medium text-xs px-2 py-1 rounded-full"
        >Follow</a>
      </nav>
      <div className="md:h-screen w-full flex flex-col items-center md:justify-center text-justify px-4">
        <div className="content mt-14 md:mt-0 ">
          <p className="text-base md:text-xl pb-4 text-warning-color text-warning-shadow">
  There was only one problem. What was now identified as the most valuable aspect of a commodity was also – technically, at least – capable of infinite replication at near zero cost: once the cost of creating a new set of instructions has been incurred the instructions can be used over and over again at no additional cost. Developing new and better instructions is equivalent to incurring a fixed cost.’ Romer made no mention of the hacker movement, but this was starting to sound remarkably similar to Stewart Brand’s conclusion that ‘information wants to be free’ some six years earlier.
          </p>
          <p className="text-base md:text-xl pb-8 text-warning-color text-warning-shadow">
  This contradiction was particularly portentous for market capitalism. As Larry Summers and J. Bradford DeLong would write in August 2001, just a month after the file-sharing service Napster was taken down, ‘the most basic condition for economic efficiency … [is] that price equal marginal cost.’ They went on: ‘with information goods, the social and marginal cost of distribution is close to zero.’ This held true not only for films, music, books and academic papers but also for the design of an industrial robot or pharmaceutical drug.
          </p>
          <a
            target="_blank"
            href="https://law.unimelb.edu.au/__data/assets/pdf_file/0009/3445353/2.-aaron-bastani-fully-automated-luxury-communism-a-manifesto-2.pdf"
            className="text-base md:text-xl pb-8 text-warning-color text-warning-shadow"
          >— Aaron Bastini</a>
        </div>
      </div>
    </>
  );
};

export default Home;
