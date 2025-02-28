import Login from "./components/Signin";
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";
// import { authOptions } from "../app/api/auth/[...nextauth]/route";

export default async function Page() {
  // const session = await getServerSession(authOptions);

  // if (session) {
  //   redirect("/dashboard");
  // }

  return (
    <main>
      <Login />
    </main>
  );
}
