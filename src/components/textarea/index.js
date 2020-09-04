import React from "react"
import { Flex } from "rebass"
import { Textarea, Label } from "@rebass/forms"
import styled from "@emotion/styled"
import Typography from "../typography"

const StyledTextArea = styled(Textarea)`
  ${Typography.Base}
  ${props =>
    props.inline &&
    `
  max-width: 350px;
  flex: 50% 0 0;
  `}
`

const StyledLabel = styled.div`
  ${Typography.Base}
  ${props =>
    props.inline
      ? `
  text-align: right;
  padding-right: 15px;
  `
      : `
  padding-bottom: 10px;
  `}
  
  ${props =>
    props.required &&
    `
  &:after {
    color: rgba(255, 0, 0, 0.5);
    content: " *";
  }
  `}
`

const TextArea = React.forwardRef(
  ({ placeholder, inline, label, name, required, ...props }, ref) => {
    return (
      <Flex
        alignItems={inline && "start"}
        flexDirection={inline ? "row" : "column"}
        {...props}
      >
        {label && (
          <Label
            flex={"30% 0 0"}
            maxWidth={"200px"}
            htmlFor={name}
            display={inline && "inline !important"}
          >
            <StyledLabel required={required} inline={inline}>
              {label}
            </StyledLabel>
          </Label>
        )}
        <StyledTextArea
          inline={inline}
          ref={ref}
          variant="textarea"
          name={name}
          placeholder={placeholder ? placeholder : "Placeholder"}
        />
      </Flex>
    )
  }
)

export default TextArea