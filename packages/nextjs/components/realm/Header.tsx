import type { FunctionComponent } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ActionIcon } from "@mantine/core";
import { NavBackIcon } from "~~/components/common/icons";
import type { Realm } from "~~/configs/pool";

const RealmHeader: FunctionComponent<{
  realm: Realm;
}> = ({ realm }) => {
  const router = useRouter();
  return (
    <div className="flex items-center">
      <ActionIcon
        variant="transparent"
        onClick={() => {
          router.push("/");
        }}
      >
        <NavBackIcon></NavBackIcon>
      </ActionIcon>

      <Image className="ml-5" alt="pool icon" src={realm.icon} width={47} height={47}></Image>
      <div className="ml-3 text-2xl font-bold text-dark2">{realm.name}</div>
    </div>
  );
};

export default RealmHeader;