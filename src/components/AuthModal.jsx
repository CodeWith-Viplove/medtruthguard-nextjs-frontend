"use client"
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Card,
  Typography,
  Upload,
  Select,
  Button as AntButton,
} from "antd";
import { User, Stethoscope, ArrowLeft, Mail, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const { Title, Paragraph } = Typography;

const ROLE_CITIZEN = "citizen";
const ROLE_DOCTOR = "doctor";

const specialtyOptions = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Neurology",
  "Psychiatry",
];

// Steps: select-role | citizen-signup | citizen-login | doctor-login | doctor-register

const AuthModal = ({ open, onClose, initialRole, onAuthenticated }) => {
  const [step, setStep] = useState("select-role");
  const [role, setRole] = useState(null); // "citizen" | "doctor" | null

  useEffect(() => {
    if (open) {
      // Reset state each time modal is opened based on initialRole
      if (initialRole === ROLE_DOCTOR) {
        setStep("doctor-login");
        setRole(ROLE_DOCTOR);
      } else if (initialRole === ROLE_CITIZEN) {
        setStep("citizen-signup");
        setRole(ROLE_CITIZEN);
      } else {
        setStep("select-role");
        setRole(null);
      }
    }
  }, [open, initialRole]);

  const handleSelectRole = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === ROLE_DOCTOR) {
      setStep("doctor-login");
    } else {
      setStep("citizen-signup");
    }
  };

  const handleBack = () => {
    setStep("select-role");
    setRole(null);
  };

  const handleFinish = (values) => {
    // Dummy auth: treat any submitted form as a successful login/signup
    console.log("Auth submit", { role, step, ...values });
    if (onAuthenticated) {
      if (role === ROLE_DOCTOR) {
        onAuthenticated({
          role: ROLE_DOCTOR,
          name: values.fullName || "Dr. Verified Doctor",
          specialty: values.specialty,
          email: values.email,
        });
      } else if (role === ROLE_CITIZEN) {
        onAuthenticated({
          role: ROLE_CITIZEN,
          name: values.fullName || "Citizen User",
          email: values.email,
        });
      } else {
        onAuthenticated({ role: "guest" });
      }
    }
    onClose();
  };

  const titleText = (() => {
    switch (step) {
      case "citizen-signup":
        return "Citizen Sign Up";
      case "citizen-login":
        return "Citizen Login";
      case "doctor-login":
        return "Doctor Login";
      case "doctor-register":
        return "Doctor Verification";
      default:
        return "Welcome to MedTruth Guard";
    }
  })();

  const subtitleText = (() => {
    switch (step) {
      case "citizen-signup":
        return "Create your account to start verifying responses";
      case "citizen-login":
        return "Enter your credentials to continue";
      case "doctor-login":
        return "Sign in with your verified doctor account";
      case "doctor-register":
        return "Provide your professional details for verification";
      default:
        return "Choose how you'd like to continue";
    }
  })();

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      closable={false}
      maskStyle={{ backgroundColor: "rgba(15, 23, 42, 0.45)" }}
      bodyStyle={{ padding: 0, borderRadius: 24, overflow: "hidden" }}
    >
      <div className="relative rounded-3xl bg-card px-6 py-6 sm:px-8 sm:py-7">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>

        {step !== "select-role" && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-sky-600"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>
        )}

        <div className="mb-5 text-center">
          <Title level={3} className="!mb-1 text-base font-semibold text-foreground sm:!text-lg">
            {titleText}
          </Title>
          <Paragraph className="!mb-0 text-xs text-muted-foreground sm:!text-sm">
            {subtitleText}
          </Paragraph>
        </div>

        {step === "select-role" && (
          <div className="flex flex-col gap-3">
            <Card
              hoverable
              className="rounded-2xl border border-border/70 bg-card/80 shadow-xs transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
              bodyStyle={{ padding: 18 }}
              onClick={() => handleSelectRole(ROLE_CITIZEN)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-500">
                  <User className="size-5" />
                </div>
                <div>
                  <Title level={4} className="!mb-1 text-sm font-semibold sm:!text-base">
                    Continue as Citizen
                  </Title>
                  <Paragraph className="!mb-0 text-xs text-muted-foreground sm:!text-sm">
                    Verify AI medical responses for personal use.
                  </Paragraph>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              className="rounded-2xl border border-border/70 bg-card/80 shadow-xs transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
              bodyStyle={{ padding: 18 }}
              onClick={() => handleSelectRole(ROLE_DOCTOR)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                  <Stethoscope className="size-5" />
                </div>
                <div>
                  <Title level={4} className="!mb-1 text-sm font-semibold sm:!text-base">
                    Continue as Doctor
                  </Title>
                  <Paragraph className="!mb-0 text-xs text-muted-foreground sm:!text-sm">
                    Review responses & contribute medical expertise.
                  </Paragraph>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "citizen-signup" && (
          <Form
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            className="space-y-3"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
            >
              <Input
                size="large"
                placeholder="you@example.com"
                prefix={<Mail className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please create a password" }]}
            >
              <Input.Password
                size="large"
                placeholder="••••••••"
                prefix={<Lock className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#0084d1", color: "white" }}
            >
              Sign Up
            </Button>

            <Paragraph className="!mb-0 mt-3 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="border-none bg-transparent p-0 text-xs font-medium text-sky-600 hover:underline"
                onClick={() => setStep("citizen-login")}
              >
                Sign in
              </button>
            </Paragraph>
          </Form>
        )}

        {step === "citizen-login" && (
          <Form
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            className="space-y-3"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
            >
              <Input
                size="large"
                placeholder="you@example.com"
                prefix={<Mail className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                size="large"
                placeholder="••••••••"
                prefix={<Lock className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#0084d1", color: "white" }}
            >
              Sign In
            </Button>

            <Paragraph className="!mb-0 mt-3 text-center text-xs text-muted-foreground">
              New here?{" "}
              <button
                type="button"
                className="border-none bg-transparent p-0 text-xs font-medium text-sky-600 hover:underline"
                onClick={() => setStep("citizen-signup")}
              >
                Sign up
              </button>
            </Paragraph>
          </Form>
        )}

        {step === "doctor-login" && (
          <Form
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            className="space-y-3"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
            >
              <Input
                size="large"
                placeholder="doctor@hospital.com"
                prefix={<Mail className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password
                size="large"
                placeholder="••••••••"
                prefix={<Lock className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#0084d1", color: "white" }}
            >
              Sign In
            </Button>

            <Paragraph className="!mb-0 mt-3 text-center text-xs text-muted-foreground">
              Not verified yet?{" "}
              <button
                type="button"
                className="border-none bg-transparent p-0 text-xs font-medium text-sky-600 hover:underline"
                onClick={() => setStep("doctor-register")}
              >
                Submit for verification
              </button>
            </Paragraph>
          </Form>
        )}

        {step === "doctor-register" && (
          <Form
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            className="space-y-3"
          >
            <Form.Item
              label="Full Name (as on license)"
              name="fullName"
              rules={[{ required: true, message: "Please enter your full name" }]}
            >
              <Input size="large" placeholder="Dr. John Smith" />
            </Form.Item>

            <Form.Item
              label="Medical License Number"
              name="licenseNumber"
              rules={[
                { required: true, message: "Please enter your license number" },
              ]}
            >
              <Input size="large" placeholder="e.g., MD-12345678" />
            </Form.Item>

            <Form.Item
              label="Medical Specialty"
              name="specialty"
              rules={[
                { required: true, message: "Please select your specialty" },
              ]}
            >
              <Select
                size="large"
                placeholder="Select your specialty"
                options={specialtyOptions.map((s) => ({ label: s, value: s }))}
              />
            </Form.Item>

            <Form.Item
              label="Hospital / Institution"
              name="hospital"
              rules={[
                { required: true, message: "Please enter your institution" },
              ]}
            >
              <Input size="large" placeholder="e.g., City General Hospital" />
            </Form.Item>

            <Form.Item label="License Document (PDF/Image)" name="licenseFile">
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept=".pdf,.png,.jpg,.jpeg"
              >
                <AntButton size="middle">Choose File</AntButton>
              </Upload>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload a scanned copy of your medical license for verification.
              </p>
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
            >
              <Input
                size="large"
                placeholder="doctor@hospital.com"
                prefix={<Mail className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please create a password" }]}
            >
              <Input.Password
                size="large"
                placeholder="••••••••"
                prefix={<Lock className="size-4 text-slate-400" />}
              />
            </Form.Item>

            <Button
              type="submit"
              size="lg"
              className="mt-1 w-full rounded-full text-sm font-semibold"
              style={{ backgroundColor: "#0084d1", color: "white" }}
            >
              Submit for Verification
            </Button>

            <Paragraph className="!mb-1 mt-3 text-center text-xs text-muted-foreground">
              Already registered?{" "}
              <button
                type="button"
                className="border-none bg-transparent p-0 text-xs font-medium text-sky-600 hover:underline"
                onClick={() => setStep("doctor-login")}
              >
                Sign in
              </button>
            </Paragraph>

            <Paragraph className="!mb-0 mt-1 text-xs text-muted-foreground">
              Your credentials will be verified by our team within 24-48 hours.
            </Paragraph>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
