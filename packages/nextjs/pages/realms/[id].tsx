import Head from "next/head";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import Footer from "~~/components/common/Footer";
import RealmHeader from "~~/components/realm/Header";
import RealmOverview from "~~/components/realm/Overview";
import SideMenu from "~~/components/realm/SideMenu";
import TokenList from "~~/components/realm/TokenList";
import { realms } from "~~/configs/pool";

const RealmPage: NextPage = () => {
  const { query } = useRouter();
  const { id } = query;
  const realm = realms.find(item => {
    return item.id === id;
  });

  return (
    <>
      <Head>
        <title>Realm</title>
        <meta name="description" content="Loanshark Scroll Alpha Testnet" />
      </Head>
      <main className="bg-white h-[--main-height] flex flex-col sm:flex-row">
        <SideMenu></SideMenu>
        <div className="flex-1 bg-leadingBg bg-no-repeat bg-cover sm:bg-[70%_auto] h-full overflow-y-scroll">
          <div className="max-w-[1055px] mx-auto pt-[33px] px-4">
            {!realm ? (
              <div></div>
            ) : (
              <>
                <RealmHeader realm={realm}></RealmHeader>
                <RealmOverview className="mt-4" realm={realm}></RealmOverview>
                <TokenList className="mt-4" realm={realm}></TokenList>
                <div className="pt-20 pb-14 w-full flex justify-center">
                  <Footer></Footer>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default RealmPage;