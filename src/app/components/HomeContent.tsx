import { AiFillCopyrightCircle } from 'react-icons/ai';

const HomeContent = () => {
  return (
    <section className="flex flex-col items-center">
      <section className="flex flex-col items-center mt-[20px]">
        <h1 className="text-2xl font-bold">{process.env.NEXT_PUBLIC_SITENAME}</h1>
      </section>

      <section className="min-h-[calc(100vh-250px)] flex items-center">
        <label>嗯......就無聊</label>
      </section>

      <div className="mt-8 flex flex-col items-center">
        <div className="flex items-center gap-1">
          <a title="Donate Icery" href="https://www.Icery.tw?donate=Icery" target="_blank">
            Donate
          </a>
          <a title="Donate Icery" href="https://www.Icery.tw" target="_blank">
            Icery
          </a>
        </div>

        <div className="flex items-center gap-1">
          <AiFillCopyrightCircle />
          <span style={{ color: 'white' }}>{new Date().getFullYear()} All Rights Reserved. Version 1.6</span>
        </div>
      </div>
    </section>
  );
};

export default HomeContent;
