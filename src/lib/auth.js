import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Citizen from "@/models/Citizen";
import Doctor from "@/models/Doctor";

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        role: { label: "Role", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        await connectToDatabase();

        const role = credentials.role;
        const email = credentials.email.toLowerCase();
        const password = credentials.password;

        const Model = role === "doctor" ? Doctor : Citizen;
        const user = await Model.findOne({ email });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        const name =
          role === "doctor"
            ? user.name
            : `${user.firstName} ${user.lastName}`.trim();

        return {
          id: user._id.toString(),
          name,
          email: user.email,
          role,
          status: user.status,
          specialization: user.specialization,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        await connectToDatabase();
        let citizen = await Citizen.findOne({ email: user.email.toLowerCase() });
        if (!citizen) {
          const nameParts = (user.name || "Citizen").split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ") || "User";

          citizen = await Citizen.create({
            firstName,
            lastName,
            email: user.email.toLowerCase(),
          });
        }
        user.id = citizen._id.toString();
        user.role = "citizen";
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          token.role = "citizen";
          token.userId = user.id;
        } else {
          token.role = user.role;
          token.userId = user.id;
          token.status = user.status;
          token.specialization = user.specialization;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.specialization = token.specialization;
      }
      return session;
    },
  },
};
